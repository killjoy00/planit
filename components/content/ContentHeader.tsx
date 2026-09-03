import Link from "next/link"

/** Public navigation shown above published pages (home, guides, FAQ, about). */
export function ContentHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          planit
        </Link>
        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          <Link href="/demo" className="text-gray-600 hover:text-gray-900">
            Demo
          </Link>
          <Link href="/guides" className="text-gray-600 hover:text-gray-900">
            Guides
          </Link>
          <Link href="/faq" className="text-gray-600 hover:text-gray-900">
            FAQ
          </Link>
          <Link href="/about" className="hidden text-gray-600 hover:text-gray-900 sm:inline">
            About
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Start a poll
          </Link>
        </nav>
      </div>
    </header>
  )
}
