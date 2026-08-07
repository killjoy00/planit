interface Props {
  title: string
  updated?: string
  children: React.ReactNode
}

/** Shared shell for the public content pages (about, privacy, terms). */
export function Prose({ title, updated, children }: Props) {
  return (
    <main className="flex-1 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
        {updated && <p className="mt-1 text-sm text-gray-400">Last updated: {updated}</p>}
        <div className="mt-8 space-y-6 text-gray-600 leading-relaxed">{children}</div>
      </div>
    </main>
  )
}

export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
      {children}
    </section>
  )
}
