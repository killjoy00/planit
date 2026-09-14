import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { isAdminEmail } from "@/lib/admin"

export default async function AcquisitionLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) notFound()
  return children
}
