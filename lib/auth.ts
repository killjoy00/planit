import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import { Resend as ResendClient } from "resend"
import { render } from "@react-email/render"
import { db } from "./db"
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
      async sendVerificationRequest({ identifier, url }) {
        const html = await render(MagicLinkEmail({ url }))
        await resend.emails.send({
          from: FROM,
          to: identifier,
          subject: "One click and you're in — planit",
          html,
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
