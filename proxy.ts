import { NextRequest, NextResponse } from "next/server"

const protectedPrefixes = ["/dashboard", "/groups", "/polls", "/admin"]
const CANONICAL_HOST = "planitnow.us"

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const host = request.headers.get("host") ?? ""

  if (host.endsWith(".vercel.app")) {
    return NextResponse.redirect(`https://${CANONICAL_HOST}${pathname}${search}`, 308)
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  // NextAuth v5 stores the session token in a cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

