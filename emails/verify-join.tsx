import { Text } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { JoinVerificationProps } from "@/lib/email"

export default function VerifyJoinEmail({
  participantName,
  creatorName,
  pollTitle,
  verifyUrl,
}: JoinVerificationProps) {
  const firstName = participantName.split(" ")[0]
  return (
    <Layout preview={`Confirm your email to vote on "${pollTitle}"`}>
      <Text style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "0 0 8px" }}>
        Hey {firstName},
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", margin: "0 0 4px" }}>
        You asked to join {creatorName}&apos;s plan, &ldquo;{pollTitle}&rdquo;. Confirm this
        address and your ballot is ready.
      </Text>
      <Button href={verifyUrl}>Confirm and vote →</Button>
      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 8px" }}>
        Or paste this into your browser:
      </Text>
      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 16px", wordBreak: "break-all" }}>
        {verifyUrl}
      </Text>
      <Text style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>
        The link is good for 24 hours. If you didn&apos;t ask to join, ignore this —
        nobody is added to a poll without confirming.
      </Text>
      <Footer />
    </Layout>
  )
}
