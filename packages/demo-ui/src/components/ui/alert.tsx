import * as React from "react"

import { cn } from "../../lib/utils"

function Alert({ className, variant = "default", ...props }: React.ComponentProps<"div"> & { variant?: "default" | "destructive" }) {
  return <div role="alert" className={cn("grid w-full gap-1 rounded-lg border px-4 py-3 text-sm", variant === "destructive" && "border-destructive/50 text-destructive", className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("font-medium leading-none", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-muted-foreground", className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
