import { headers } from "next/headers"
import type { EmailSendPurpose, Prisma } from "@/app/generated/prisma/client"

import { db } from "./db"

export const ADDRESS_COOLDOWN_MS = 60 * 1000
export const SIGN_IN_ADDRESS_MAX_PER_DAY = 5
export const SIGN_IN_SOURCE_MAX_PER_HOUR = 15
export const JOIN_ADDRESS_MAX_PER_DAY = 5
export const JOIN_SOURCE_MAX_PER_HOUR = 30
export const JOIN_SCOPE_MAX_PER_HOUR = 100

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
export const PRUNE_AFTER_MS = 2 * DAY_MS

export type EmailSendRefusal = "cooldown" | "address-quota" | "source-quota" | "scope-quota"

export async function clientIp(): Promise<string | null> {
  try {
    const h = await headers()
    const forwarded = h.get("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0]?.trim() || null
    return h.get("x-real-ip")?.trim() || null
  } catch {
    return null
  }
}

interface ReserveEmailSendInput {
  purpose: EmailSendPurpose
  email: string
  ip: string | null
  scope?: string | null
  now?: Date
}

/**
 * Atomically reserve one public email send.
 *
 * The previous check-then-create sequence let a burst of simultaneous requests
 * all observe the same empty window. Transaction-scoped advisory locks make the
 * decision and its record one operation for both the address and source.
 */
export async function reserveEmailSend({
  purpose,
  email,
  ip,
  scope = null,
  now = new Date(),
}: ReserveEmailSendInput): Promise<EmailSendRefusal | null> {
  const address = email.trim().toLowerCase()

  return db.$transaction(async (tx) => {
    const lockKeys = [
      `${purpose}:email:${address}`,
      ...(ip ? [`${purpose}:ip:${ip}`] : []),
      ...(scope ? [`${purpose}:scope:${scope}`] : []),
    ].sort()
    for (const key of lockKeys) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`
    }

    const [recent, addressCount, sourceCount, scopeCount] = await Promise.all([
      tx.emailSendAttempt.findFirst({
        where: { purpose, email: address },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      tx.emailSendAttempt.count({
        where: { purpose, email: address, createdAt: { gte: new Date(now.getTime() - DAY_MS) } },
      }),
      ip
        ? tx.emailSendAttempt.count({
            where: { purpose, ip, createdAt: { gte: new Date(now.getTime() - HOUR_MS) } },
          })
        : Promise.resolve(0),
      scope
        ? tx.emailSendAttempt.count({
            where: { purpose, scope, createdAt: { gte: new Date(now.getTime() - HOUR_MS) } },
          })
        : Promise.resolve(0),
    ])

    if (recent && now.getTime() - recent.createdAt.getTime() < ADDRESS_COOLDOWN_MS) {
      return "cooldown"
    }

    const addressMax = purpose === "SIGN_IN" ? SIGN_IN_ADDRESS_MAX_PER_DAY : JOIN_ADDRESS_MAX_PER_DAY
    const sourceMax = purpose === "SIGN_IN" ? SIGN_IN_SOURCE_MAX_PER_HOUR : JOIN_SOURCE_MAX_PER_HOUR
    if (addressCount >= addressMax) return "address-quota"
    if (sourceCount >= sourceMax) return "source-quota"
    if (purpose === "JOIN" && scopeCount >= JOIN_SCOPE_MAX_PER_HOUR) return "scope-quota"

    await tx.emailSendAttempt.create({
      data: { purpose, email: address, ip, scope },
    })
    return null
  }, { isolationLevel: "Serializable" as Prisma.TransactionIsolationLevel })
}

export async function pruneEmailSendAttempts(now: Date = new Date()): Promise<number> {
  const { count } = await db.emailSendAttempt.deleteMany({
    where: { createdAt: { lt: new Date(now.getTime() - PRUNE_AFTER_MS) } },
  })
  return count
}
