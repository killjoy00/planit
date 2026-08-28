"use client"

import Link from "next/link"
import { useState } from "react"

import { SignOutButton } from "./SignOutButton"

export function AppNavigation({ showAdmin }: { showAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const links = (
    <>
      <Link href="/dashboard" onClick={close} className="text-gray-600 hover:text-gray-900">Dashboard</Link>
      <Link href="/groups" onClick={close} className="text-gray-600 hover:text-gray-900">Groups</Link>
      {showAdmin && <Link href="/admin" onClick={close} className="text-gray-600 hover:text-gray-900">Admin</Link>}
      <Link href="/polls/new" onClick={close} className="rounded-lg bg-indigo-600 px-3 py-2 font-medium text-white hover:bg-indigo-700">
        New poll
      </Link>
      <SignOutButton />
    </>
  )

  return (
    <>
      <nav className="hidden items-center gap-4 text-sm sm:flex" aria-label="Account navigation">
        {links}
      </nav>
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-account-navigation"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700"
        >
          {open ? "Close" : "Menu"}
        </button>
        {open && (
          <nav
            id="mobile-account-navigation"
            aria-label="Account navigation"
            className="absolute right-0 top-12 z-30 flex w-48 flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-lg"
          >
            {links}
          </nav>
        )}
      </div>
    </>
  )
}
