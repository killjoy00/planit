import { NextRequest } from "next/server"

export function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return false
  const token = authHeader.replace("Bearer ", "")
  return token === process.env.CRON_SECRET
}
