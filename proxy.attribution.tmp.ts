import { NextRequest, NextResponse } from "next/server"
import {
  ACQUISITION_COOKIE,
  attributionFromRequest,
  parseAttribution,
  serializeAttribution,
} from "@/lib/acquisition-cookie"

const protectedPrefixes = ["/dashboard", "/groups", "/polls", "/admin"]
const CANONICAL_HOST = "planitnow.us"
const THIRTY_DAYS = 30 * 24 * 60 * 60

export function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl
  const host = request.headers.get("host") ?? ""

  if (host.endsWith(".vercel.app")) {
    return NextResponse.redirect(`https://${CANONICAL_HOST}${pathname}${search}`, 308)
  }

  const useCase = pathname.startsWith("/for/")
    ? pathname.split("/")[2]
    : searchParams.get("preset") ?? undefined
  const hasAcquisitionSignal = Boolean(
    useCase || searchParams.get("utm_source") || searchParams.get("utm_campaign") || searchParams.get("src"),
  )

  const applyAttribution = (response: NextResponse) => {
    if (!hasAcquisitionSignal) return response
    const existing = parseAttribution(request.cookies.get(ACQUISITION_COOKIE)?.value)
    const attribution = attributionFromRequest(searchParams, useCase, existing)
    response.cookies.set(ACQUISITION_COOKIE, serializeAttribution(attribution), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: THIRTY_DAYS,
    })
    return response
  }

  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))
  if (!isProtected) return applyAttribution(NextResponse.next())

  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
    return applyAttribution(NextResponse.redirect(loginUrl))
  }

  return applyAttribution(NextResponse.next())
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
