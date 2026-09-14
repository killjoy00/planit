import type { ReactNode } from "react"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { isAdminEmail } from "@/lib/admin"
import { AcquisitionFunnel } from "@/components/admin/AcquisitionFunnel"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) notFound()

  return (
    <div className="space-y-10">
      {children}
      <AcquisitionFunnel />
    </div>
  )
}
