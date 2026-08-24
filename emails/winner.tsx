import { Text } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { WinnerEmailProps } from "@/lib/email"

export default function WinnerEmail({
  participantName,
  pollTitle,
  winnerLabel,
  resultsUrl,
  icsUrl,
  unsubscribeUrl,
}: WinnerEmailProps) {
  const firstName = participantName.split(" ")[0]
  return (
    <Layout preview={`It's decided! ${pollTitle} → ${winnerLabel}`}>
      <Text style={{ fontSize: "24px", fontWeight: "700", color: "#111827", margin: "0 0 8px" }}>
        It&apos;s decided, {firstName}!
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", margin: "0 0 4px" }}>
        The group voted and the winner for <strong>{pollTitle}</strong> is:
      </Text>
      <Text
        style={{
          fontSize: "22px",
          fontWeight: "700",
          color: "#4f46e5",
          margin: "16px 0",
          padding: "16px",
          backgroundColor: "#eef2ff",
          borderRadius: "8px",
          textAlign: "center",
        }}
      >
        {winnerLabel}
      </Text>
      <Button href={resultsUrl}>See full results</Button>
      {icsUrl && (
        <Text style={{ fontSize: "14px", color: "#6b7280", textAlign: "center", margin: "0" }}>
          <a href={icsUrl} style={{ color: "#4f46e5" }}>Add to calendar (.ics)</a>
        </Text>
      )}
      <Footer unsubscribeUrl={unsubscribeUrl} />
    </Layout>
  )
}
