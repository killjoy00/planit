import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Font,
} from "@react-email/components"

interface LayoutProps {
  preview: string
  children: React.ReactNode
}

export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f9fafb",
          fontFamily: "Inter, Helvetica, Arial, sans-serif",
          margin: 0,
          padding: 0,
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "40px auto",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "40px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          {children}
        </Container>
      </Body>
    </Html>
  )
}
