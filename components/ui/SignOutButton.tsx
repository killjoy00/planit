"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-gray-400 hover:text-gray-600 text-sm"
    >
      Sign out
    </button>
  )
}
