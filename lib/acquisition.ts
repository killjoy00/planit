const SOURCE_MAX = 80
const CAMPAIGN_MAX = 120

export interface AcquisitionAttribution {
  source: string
  campaign?: string
  useCase?: string
}

function normalizeLabel(value: string | null | undefined, max: number): string | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return normalized ? normalized.slice(0, max) : undefined
}

export function attributionFromParams(params: URLSearchParams, useCase?: string): AcquisitionAttribution {
  return {
    source: normalizeLabel(params.get("utm_source") ?? params.get("src"), SOURCE_MAX) ?? (useCase ? "use-case" : "direct"),
    campaign: normalizeLabel(params.get("utm_campaign"), CAMPAIGN_MAX),
    useCase: normalizeLabel(useCase, SOURCE_MAX),
  }
}

export function attributionFromUrl(rawUrl: string | null | undefined, useCase?: string): AcquisitionAttribution | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    return attributionFromParams(url.searchParams, useCase)
  } catch {
    return null
  }
}

export function trackedHref(path: string, params: URLSearchParams, defaults?: { source?: string; useCase?: string }): string {
  const url = new URL(path, "https://planitnow.us")
  const source = params.get("utm_source") ?? params.get("src") ?? defaults?.source
  const campaign = params.get("utm_campaign")
  if (source) url.searchParams.set("src", source)
  if (params.get("utm_source")) url.searchParams.set("utm_source", params.get("utm_source")!)
  if (campaign) url.searchParams.set("utm_campaign", campaign)
  if (defaults?.useCase) url.searchParams.set("preset", defaults.useCase)
  return `${url.pathname}${url.search}`
}
