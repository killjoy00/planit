import { Text } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"

interface MagicLinkEmailProps {
  url: string
}

export default function MagicLinkEmail({ url }: MagicLinkEmailProps) {
  return (
    <Layout preview="One click and you're in — your planit sign-in link">
      <Text style={{ fontSize: "28px", fontWeight: "700", color: "#111827", margin: "0 0 8px", letterSpacing: "-0.5px" }}>
        You&apos;re one click away.
      </Text>
      <Text style={{ fontSize: "16px", color: "#6b7280", margin: "0 0 4px", lineHeight: "1.6" }}>
        Hit the button below to sign in to planit. No password, no friction — just you and your group, ready to make a plan.
      </Text>
      <Button href={url}>Sign in to planit →</Button>
      <Text style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 8px", lineHeight: "1.6" }}>
        Button not working? Copy this link and paste it into your browser:
      </Text>
      {/*
        Deliberately plain text, not a link: this block exists to be selected
        and copied, and an anchor here is exactly what turns a long-press into
        an accidental navigation. Opening it early is harmless either way — it
        leads to a confirmation page that doesn't spend the sign-in token.
      */}
      <Text
        style={{
          fontSize: "13px",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          color: "#4f46e5",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "12px 14px",
          margin: "0 0 24px",
          lineHeight: "1.5",
          wordBreak: "break-all",
          overflowWrap: "break-word",
        }}
      >
        {url}
      </Text>
      <Text style={{ fontSize: "13px", color: "#9ca3af", margin: "0", lineHeight: "1.6" }}>
        This link expires in 24 hours. It stays valid until you press the sign-in button on that page, so opening it by accident won&apos;t cost you anything. If you didn&apos;t request it, someone may have mistyped their email — safe to ignore.
      </Text>
    </Layout>
  )
}
