import { NextRequest, NextResponse } from "next/server"

const protectedPrefixes = ["/dashboard", "/groups", "/polls"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|vote).*)"],
}
