export interface Jurisdiction {
  lga_id: number | null
  state_id: number | null
}
export function isWithinJurisdiction(
  scope: Jurisdiction,
  issue: { lga_id: number | null; state_id: number | null },
): boolean {
  if (scope.lga_id != null && scope.lga_id !== issue.lga_id) return false
  if (scope.state_id != null && scope.state_id !== issue.state_id) return false
  return true
}
