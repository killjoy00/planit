import { db } from "@/lib/db"
import { generateICS } from "@/lib/ics"
import { NextRequest, NextResponse } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ pollId: string }> }) {
  const { pollId } = await params

  const poll = await db.poll.findUnique({
    where: { id: pollId, status: "CLOSED" },
    include: { winner: true },
  })

  if (!poll?.winner?.dateValue) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const ics = generateICS(poll.title, poll.winner.dateValue, poll.description ?? undefined, poll.winner.endDate)
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="${poll.title.replace(/\s+/g, "-")}.ics"`,
    },
  })
}
