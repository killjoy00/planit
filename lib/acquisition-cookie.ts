const SOURCE_MAX = 80
const CAMPAIGN_MAX = 120
const COOKIE_SEPARATOR = "~"

export const ACQUISITION_COOKIE = "planit_acq"

export interface AcquisitionAttribution {
  source: string
  campaign?: string
  useCase?: string
}

function normalizeLabel(value: string | null | undefined, max: number): string | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "")
  return normalized ? normalized.slice(0, max) : undefined
}

export function attributionFromRequest(
  params: URLSearchParams,
  useCase?: string,
  existing?: AcquisitionAttribution | null,
): AcquisitionAttribution {
  const normalizedUseCase = normalizeLabel(useCase, SOURCE_MAX)
  return {
    source: normalizeLabel(params.get("utm_source") ?? params.get("src"), SOURCE_MAX)
      ?? existing?.source
      ?? (normalizedUseCase ? "use-case" : "direct"),
    campaign: normalizeLabel(params.get("utm_campaign"), CAMPAIGN_MAX) ?? existing?.campaign,
    useCase: normalizedUseCase ?? existing?.useCase,
  }
}

export function serializeAttribution(value: AcquisitionAttribution): string {
  return [value.source, value.campaign ?? "", value.useCase ?? ""].join(COOKIE_SEPARATOR)
}

export function parseAttribution(value: string | null | undefined): AcquisitionAttribution | null {
  if (!value) return null
  const [source, campaign, useCase] = value.split(COOKIE_SEPARATOR)
  const normalizedSource = normalizeLabel(source, SOURCE_MAX)
  if (!normalizedSource) return null
  return {
    source: normalizedSource,
    campaign: normalizeLabel(campaign, CAMPAIGN_MAX),
    useCase: normalizeLabel(useCase, SOURCE_MAX),
  }
}
