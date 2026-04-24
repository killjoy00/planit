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
      <Text style={{ fontSize: "13px", color: "#9ca3af", margin: "0", lineHeight: "1.6" }}>
        This link expires in 24 hours and works only once. If you didn&apos;t request it, someone may have mistyped their email — safe to ignore.
      </Text>
    </Layout>
  )
}
