export type VariantProps<T> = T extends (props?: infer P) => string ? P : never

export function cva(base: string) {
  return (_props?: Record<string, unknown>) => base
}
