export interface AcquisitionRow {
  source: string
  use_case: string | null
  signups: bigint
  first_polls: bigint
  first_vote: bigint
  successful_close: bigint
  second_poll_30d: bigint
}
