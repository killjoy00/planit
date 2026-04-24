"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Group, GroupMember } from "@/app/generated/prisma/client"

interface Props {
  group: Group & { members: GroupMember[] }
}

export function GroupEditor({ group }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(group.name)
  const [members, setMembers] = useState(
    group.members.map((m) => ({ id: m.id, name: m.name, email: m.email }))
  )
  const [newMembers, setNewMembers] = useState([{ name: "", email: "" }])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  function removeExisting(id: string) {
    setMembers((m) => m.filter((mem) => mem.id !== id))
  }

  function addNew() {
    setNewMembers((m) => [...m, { name: "", email: "" }])
  }

  function updateNew(i: number, field: "name" | "email", value: string) {
    setNewMembers((m) => m.map((mem, idx) => (idx === i ? { ...mem, [field]: value } : mem)))
  }

  function removeNew(i: number) {
    setNewMembers((m) => m.filter((_, idx) => idx !== i))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    const toAdd = newMembers.filter((m) => m.name && m.email)

    startTransition(async () => {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          keepMemberIds: members.map((m) => m.id),
          addMembers: toAdd,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to save.")
        return
      }
      setSuccess("Saved!")
      setNewMembers([{ name: "", email: "" }])
      router.refresh()
    })
  }

  async function handleDelete() {
    if (!confirm(`Delete "${group.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await fetch(`/api/groups/${group.id}`, { method: "DELETE" })
      router.push("/groups")
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Group name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current members</label>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <span className="font-medium text-gray-800">{m.name}</span>
              <span className="text-gray-500">{m.email}</span>
              <button
                type="button"
                onClick={() => removeExisting(m.id)}
                className="text-gray-400 hover:text-red-500 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Add members</label>
        <div className="space-y-2">
          {newMembers.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={m.name}
                onChange={(e) => updateNew(i, "name", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <input
                type="email"
                placeholder="Email"
                value={m.email}
                onChange={(e) => updateNew(i, "email", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {newMembers.length > 1 && (
                <button type="button" onClick={() => removeNew(i)} className="text-gray-400 hover:text-red-500">✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addNew} className="mt-2 text-sm text-indigo-600 hover:underline">+ Add another</button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          Delete group
        </button>
      </div>
    </form>
  )
}
