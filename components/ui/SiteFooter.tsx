import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} planit
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/guides" className="text-gray-500 hover:text-indigo-600">Guides</Link>
          <Link href="/faq" className="text-gray-500 hover:text-indigo-600">FAQ</Link>
          <Link href="/about" className="text-gray-500 hover:text-indigo-600">About</Link>
          <Link href="/privacy" className="text-gray-500 hover:text-indigo-600">Privacy</Link>
          <Link href="/terms" className="text-gray-500 hover:text-indigo-600">Terms</Link>
        </nav>
      </div>
    </footer>
  )
}
