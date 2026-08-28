"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface Member {
  name: string
  email: string
}

export default function NewGroupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState("")
  const [members, setMembers] = useState<Member[]>([{ name: "", email: "" }])
  const [error, setError] = useState("")

  function addMember() {
    setMembers((m) => [...m, { name: "", email: "" }])
  }

  function removeMember(i: number) {
    setMembers((m) => m.filter((_, idx) => idx !== i))
  }

  function updateMember(i: number, field: keyof Member, value: string) {
    setMembers((m) => m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const validMembers = members.filter((m) => m.name && m.email)
    if (!name.trim()) return setError("Group name is required.")
    if (validMembers.length === 0) return setError("Add at least one member.")

    startTransition(async () => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), members: validMembers }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Something went wrong.")
        return
      }
      const { id } = await res.json()
      router.push(`/groups/${id}`)
    })
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New group</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
          <input
            type="text"
            required
            placeholder="e.g. College friends, Book club"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
          <div className="space-y-2">
            {members.map((member, i) => (
              <div key={i} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  placeholder="Name"
                  value={member.name}
                  onChange={(e) => updateMember(i, "name", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={member.email}
                  onChange={(e) => updateMember(i, "email", e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    className="self-start px-2 py-2 text-sm text-gray-500 hover:text-red-500 sm:self-auto"
                    aria-label={`Remove member ${i + 1}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMember}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            + Add another member
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Creating…" : "Create group"}
        </button>
      </form>
    </div>
  )
}
