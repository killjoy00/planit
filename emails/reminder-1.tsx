import { Text } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { ReminderEmailProps } from "@/lib/email"

export default function Reminder1Email({
  participantName,
  creatorName,
  pollTitle,
  voteUrl,
  optOutUrl,
  votedCount,
  totalCount,
}: ReminderEmailProps) {
  const firstName = participantName.split(" ")[0]
  return (
    <Layout preview={`Don't forget — ${pollTitle} needs your vote`}>
      <Text style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "0 0 8px" }}>
        Hey {firstName},
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", margin: "0 0 4px" }}>
        Just a quick nudge — <strong>{creatorName}</strong> is still waiting on votes for <strong>{pollTitle}</strong>.
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", margin: "8px 0 0" }}>
        {votedCount} of {totalCount} people have voted so far.
      </Text>
      <Button href={voteUrl}>Cast your vote →</Button>
      <Footer optOutUrl={optOutUrl} />
    </Layout>
  )
}
