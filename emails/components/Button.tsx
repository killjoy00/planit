import { Button as EmailButton } from "@react-email/components"

interface ButtonProps {
  href: string
  children: React.ReactNode
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      style={{
        display: "block",
        backgroundColor: "#4f46e5",
        color: "#ffffff",
        fontSize: "16px",
        fontWeight: "600",
        textDecoration: "none",
        textAlign: "center",
        padding: "16px 24px",
        borderRadius: "8px",
        margin: "24px 0",
      }}
    >
      {children}
    </EmailButton>
  )
}
