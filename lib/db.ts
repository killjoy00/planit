import { PrismaClient } from "../app/generated/prisma/client.ts"
import { PrismaPg } from "@prisma/adapter-pg"
import { hardenPostgresSslMode } from "./postgres-url.ts"

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is required.")

  const adapter = new PrismaPg({ connectionString: hardenPostgresSslMode(connectionString) })
  const options = { adapter } as ConstructorParameters<typeof PrismaClient>[0]
  return new PrismaClient(options)
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
