import { Text } from "react-email"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { WinnerEmailProps } from "@/lib/email"

export default function WinnerEmail({
  participantName,
  pollTitle,
  winnerLabel,
  finalLocation,
  finalNotes,
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
      {(finalLocation || finalNotes) && (
        <Text style={{ fontSize: "15px", color: "#374151", margin: "0 0 18px", lineHeight: "22px" }}>
          {finalLocation && <><strong>Where:</strong> {finalLocation}<br /></>}
          {finalNotes && <><strong>Plan:</strong> {finalNotes}</>}
        </Text>
      )}
      <Button href={resultsUrl}>See the final plan</Button>
      {icsUrl && (
        <Text style={{ fontSize: "14px", color: "#6b7280", textAlign: "center", margin: "0" }}>
          <a href={icsUrl} style={{ color: "#4f46e5" }}>Add it to your calendar (.ics)</a>
        </Text>
      )}
      <Footer unsubscribeUrl={unsubscribeUrl} />
    </Layout>
  )
}
