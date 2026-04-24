import { Text } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { ReminderEmailProps } from "@/lib/email"

export default function Reminder2Email({
  participantName,
  creatorName,
  pollTitle,
  voteUrl,
  optOutUrl,
  votedCount,
  totalCount,
}: ReminderEmailProps) {
  const firstName = participantName.split(" ")[0]
  const remaining = totalCount - votedCount
  return (
    <Layout preview={`Still waiting on you for ${pollTitle}`}>
      <Text style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "0 0 8px" }}>
        Still waiting, {firstName}.
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", margin: "0 0 4px" }}>
        <strong>{votedCount}</strong> of <strong>{totalCount}</strong> people have voted on <strong>{pollTitle}</strong>.{" "}
        {remaining === 1 ? "Just you left." : `${remaining} people haven't voted yet, including you.`}
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", margin: "8px 0 0" }}>
        <strong>{creatorName}</strong> can&apos;t finalize the plan until everyone weighs in.
      </Text>
      <Button href={voteUrl}>Vote now — takes 10 seconds</Button>
      <Footer optOutUrl={optOutUrl} />
    </Layout>
  )
}
