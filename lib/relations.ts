/** Normalize Supabase's singular joins, including untyped array-shaped results. */
export function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null)
}

export function pageNumber(value?: string): number {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0
    ? Math.min(number, 100000)
    : 1
}
