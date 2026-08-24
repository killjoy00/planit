import { Text, Section } from "@react-email/components"
import { Layout } from "./components/Layout"
import { Button } from "./components/Button"
import { Footer } from "./components/Footer"
import type { InviteEmailProps } from "@/lib/email"

export default function InviteEmail({
  participantName,
  creatorName,
  pollTitle,
  pollDescription,
  voteUrl,
  deadline,
  options,
  unsubscribeUrl,
}: InviteEmailProps) {
  const firstName = participantName.split(" ")[0]
  return (
    <Layout preview={`${creatorName} wants your vote on "${pollTitle}"`}>
      <Text style={{ fontSize: "20px", fontWeight: "600", color: "#111827", margin: "0 0 8px" }}>
        Hey {firstName},
      </Text>
      <Text style={{ fontSize: "16px", color: "#374151", margin: "0 0 4px" }}>
        {creatorName} is planning &ldquo;{pollTitle}&rdquo; and wants to know if you&apos;re in.
      </Text>
      {pollDescription && (
        <Text style={{ fontSize: "14px", color: "#6b7280", margin: "8px 0 0" }}>
          {pollDescription}
        </Text>
      )}
      {options.length > 0 && (
        <Section style={{ margin: "16px 0 0", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
          {options.slice(0, 4).map((opt, i) => (
            <Text key={i} style={{ margin: "4px 0", fontSize: "14px", color: "#374151" }}>
              {opt.dateStr
                ? <>{"•"} {opt.label} <span style={{ color: "#6b7280" }}>({opt.dateStr})</span></>
                : <>{"•"} {opt.label}</>
              }
            </Text>
          ))}
          {options.length > 4 && (
            <Text style={{ margin: "4px 0", fontSize: "14px", color: "#9ca3af" }}>
              + {options.length - 4} more options
            </Text>
          )}
        </Section>
      )}
      <Button href={voteUrl}>Vote now →</Button>
      <Text style={{ fontSize: "13px", color: "#6b7280", margin: "0" }}>
        Takes 10 seconds. No account needed.
        {deadline && (
          <> Voting closes {deadline.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.</>
        )}
      </Text>
      <Footer optOutUrl={`${voteUrl}/opted-out`} unsubscribeUrl={unsubscribeUrl} />
    </Layout>
  )
}
