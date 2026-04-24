import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const participant = await db.participant.findUnique({ where: { token } })
  if (!participant) return NextResponse.json({ error: "Invalid link" }, { status: 404 })

  await db.participant.update({ where: { token }, data: { optedOut: true } })
  return NextResponse.json({ ok: true })
}
