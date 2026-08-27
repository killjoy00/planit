import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
    // Keep failures (a spent or expired magic link, most often) on our own
    // page, which can offer a fresh link, instead of the stock Auth.js error
    // screen. Arrives as `/login?error=<Type>`.
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isAuthed = !!auth?.user

      const protectedPrefixes = ["/dashboard", "/groups", "/polls", "/admin"]
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

      if (isProtected && !isAuthed) return false
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
