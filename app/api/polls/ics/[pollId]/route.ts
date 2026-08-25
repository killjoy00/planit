import { db } from "@/lib/db"
import { generateICS } from "@/lib/ics"
import { NextRequest, NextResponse } from "next/server"

/**
 * A filename safe to sit inside a quoted `Content-Disposition` parameter.
 *
 * The poll title goes straight into that header, and titles are free text: a
 * quote in `Dinner at "The Ivy"` closes the parameter early, so the download
 * arrives named `Dinner-at-` or, in some clients, with no name at all.
 */
function safeFilename(title: string): string {
  const cleaned = title
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/["\\/:*?<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80)
  return cleaned || "planit-event"
}

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
      "Content-Disposition": `attachment; filename="${safeFilename(poll.title)}.ics"`,
    },
  })
}
