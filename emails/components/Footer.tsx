import { Hr, Text, Link } from "@react-email/components"

interface FooterProps {
  optOutUrl?: string
}

export function Footer({ optOutUrl }: FooterProps) {
  return (
    <>
      <Hr style={{ borderColor: "#e5e7eb", margin: "32px 0 16px" }} />
      <Text style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
        Sent by planit.
        {optOutUrl && (
          <>
            {" "}
            <Link
              href={optOutUrl}
              style={{ color: "#9ca3af", textDecoration: "underline" }}
            >
              Opt out of this poll
            </Link>
          </>
        )}
      </Text>
    </>
  )
}
