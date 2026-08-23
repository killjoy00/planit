import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import { Resend as ResendClient } from "resend"
import { render } from "@react-email/render"
import { db } from "./db"
import { buildConfirmUrl, verificationSecret } from "./magic-link"
import { authConfig } from "@/auth.config"
import MagicLinkEmail from "@/emails/magic-link"

const resend = new ResendClient(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "planit <noreply@example.com>"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db as any),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: FROM,
      // Pinned so `lib/magic-link.ts` can hash a token exactly the way the
      // callback does when it looks one up without spending it.
      secret: verificationSecret(),
      async sendVerificationRequest({ identifier, url, token }) {
        // `url` is the Auth.js callback, which burns the token on any GET.
        // Send the confirmation page instead; it carries the same token
        // through to the callback once the reader deliberately clicks.
        const callback = new URL(url)
        const confirmUrl = buildConfirmUrl(callback.origin, {
          token,
          email: identifier,
          callbackUrl: callback.searchParams.get("callbackUrl"),
        })

        const email = MagicLinkEmail({ url: confirmUrl })
        const [html, text] = await Promise.all([
          render(email),
          render(email, { plainText: true }),
        ])

        await resend.emails.send({
          from: FROM,
          to: identifier,
          subject: "One click and you're in — planit",
          html,
          text,
        })
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
