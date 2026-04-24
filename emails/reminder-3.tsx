import { Text } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { ReminderEmailProps } from "@/lib/email"

export default function Reminder3Email({
  participantName,
  creatorName,
  pollTitle,
  voteUrl,
  optOutUrl,
  pendingNames = [],
}: ReminderEmailProps) {
  const firstName = participantName.split(" ")[0]

  const othersWaiting = pendingNames.filter((n) => n !== participantName)
  let waitingLine = ""
  if (othersWaiting.length === 0) {
    waitingLine = "You're the last one."
  } else if (othersWaiting.length === 1) {
    waitingLine = `Still waiting on: ${othersWaiting[0]} and you.`
  } else {
    const listed = othersWaiting.slice(0, 2).join(", ")
    const extra = othersWaiting.length > 2 ? ` and ${othersWaiting.length - 2} others` : ""
    waitingLine = `Still waiting on: ${listed}${extra}, and you.`
  }

  return (
    <Layout preview={`${creatorName} is still waiting on you for ${pollTitle}`}>
      <Text style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "0 0 8px" }}>
        {firstName}, this is the last reminder.
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", margin: "0 0 4px" }}>
        <strong>{creatorName}</strong> is waiting to finalize <strong>{pollTitle}</strong>.
      </Text>
      <Text style={{ fontSize: "14px", color: "#6b7280", margin: "8px 0 0" }}>
        {waitingLine} If you don&apos;t vote, the group will move forward without you.
      </Text>
      <Button href={voteUrl}>Vote now</Button>
      <Footer optOutUrl={optOutUrl} />
    </Layout>
  )
}
