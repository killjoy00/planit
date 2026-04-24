import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isAuthed = !!auth?.user

      const protectedPrefixes = ["/dashboard", "/groups", "/polls"]
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p))

      if (isProtected && !isAuthed) return false
      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
