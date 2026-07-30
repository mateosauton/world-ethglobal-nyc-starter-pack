export type ClassValue = string | number | boolean | null | undefined | unknown[] | Record<string, boolean>

export function clsx(...values: ClassValue[]): string {
  return values.flat().filter(Boolean).join(" ")
}
