import { Hr, Text, Link } from "@react-email/components"

interface FooterProps {
  /** Leave this one plan. */
  optOutUrl?: string
  /** Stop all planit email, everywhere. Mirrors the List-Unsubscribe header. */
  unsubscribeUrl?: string
}

const linkStyle = { color: "#9ca3af", textDecoration: "underline" }

/**
 * Both exits, stated plainly.
 *
 * A visible unsubscribe is what a reader looks for before reaching for
 * report-spam, and the two are not the same promise: opting out of a plan
 * still lets a friend invite you to the next one, unsubscribing does not.
 */
export function Footer({ optOutUrl, unsubscribeUrl }: FooterProps) {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
      <Text style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
        Sent by planit because someone added you to a plan.
        {optOutUrl && (
          <>
            {" "}
            <Link href={optOutUrl} style={linkStyle}>
              Opt out of this poll
            </Link>
            {unsubscribeUrl ? "," : "."}
          </>
        )}
        {unsubscribeUrl && (
          <>
            {optOutUrl ? " or " : " "}
            <Link href={unsubscribeUrl} style={linkStyle}>
              unsubscribe from all planit email
            </Link>
            .
          </>
        )}
      </Text>
    </>
  )
}
