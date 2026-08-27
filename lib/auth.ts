import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Resend from "next-auth/providers/resend"
import { Resend as ResendClient } from "resend"
import { render } from "@react-email/render"
import { db } from "./db"
import { buildConfirmUrl, verificationSecret } from "./magic-link"
import { clientIp, reserveEmailSend } from "./signin-rate-limit"
import { authConfig } from "@/auth.config"
import MagicLinkEmail from "@/emails/magic-link"

const resend = new ResendClient(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "planit <noreply@example.com>"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
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

        // Deliberately not routed through `sendBulk`, so the suppression list
        // does not apply: this is a link the reader just asked for by typing
        // their address into the sign-in form, not mail we decided to send.
        //
        // `emails.send` resolves with `{ data: null, error }` instead of
        // throwing, so awaiting it alone would report a refused sign-in link as
        // a sent one and leave the reader watching an empty inbox. Auth.js
        // surfaces a throw here as an error on the sign-in page.
        const { error } = await resend.emails.send({
          from: FROM,
          to: identifier,
          subject: "One click and you're in — planit",
          html,
          text,
        })
        if (error) throw new Error(`Could not send the sign-in link: ${error.message}`)
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Gate on who we are willing to mail a sign-in link to.
     *
     * Auth.js runs this before it mints a verification token or calls the
     * mailer, so refusing here costs a database read and nothing else — no
     * orphan token, no message. It also runs on the callback leg, where
     * `email.verificationRequest` is absent; only the send is rate limited,
     * because someone holding a valid token has already been mailed.
     *
     * The login form is public and takes any address, which is what a magic
     * link is — so without this it will send mail to whoever a stranger types
     * in, as often as they ask.
     */
    async signIn({ user, email }) {
      if (!email?.verificationRequest) return true

      const address = user?.email
      if (!address) return false

      const ip = await clientIp()
      const refusal = await reserveEmailSend({ purpose: "SIGN_IN", email: address, ip })
      if (refusal) {
        console.warn(`[signin] refused ${refusal} for ${address}${ip ? ` from ${ip}` : ""}`)
        return false
      }

      return true
    },
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})
