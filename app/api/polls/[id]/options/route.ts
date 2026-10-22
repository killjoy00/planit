import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { renamePollOption, RenameOptionError } from "@/lib/poll-option-renaming"

const schema = z.object({
  optionId: z.string().min(1),
  label: z.string().trim().min(1).max(200),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter an option name (up to 200 characters)." }, { status: 400 })

  const { id } = await params
  try {
    const option = await renamePollOption(id, session.user.id, parsed.data.optionId, parsed.data.label)
    return NextResponse.json(option)
  } catch (error) {
    if (error instanceof RenameOptionError) {
      if (error.code === "NOT_FOUND") return NextResponse.json({ error: "Option not found." }, { status: 404 })
      if (error.code === "NOT_EDITABLE") {
        return NextResponse.json({ error: "Only open polls with named choices can be edited." }, { status: 409 })
      }
      if (error.code === "VOTING_STARTED") {
        return NextResponse.json({ error: "Option names are locked once someone has voted." }, { status: 409 })
      }
      return NextResponse.json({ error: "Enter an option name (up to 200 characters)." }, { status: 400 })
    }
    throw error
  }
}
