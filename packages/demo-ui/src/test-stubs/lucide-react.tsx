import type * as React from "react"

function Icon(props: React.ComponentProps<"svg">) {
  return <svg aria-hidden="true" {...props} />
}

export const AlertCircle = Icon
export const Check = Icon
export const CheckCircle2 = Icon
export const ChevronDown = Icon
export const ChevronUp = Icon
export const Circle = Icon
export const Copy = Icon
export const ExternalLink = Icon
export const LoaderCircle = Icon
export const Radio = Icon
export const X = Icon
