"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

type CodePanelProps = {
  code: string
  language?: string
  title?: string
}

function CodePanel({ code, language = "typescript", title = "Implementation" }: CodePanelProps) {
  const [copied, setCopied] = React.useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <span className="font-mono text-xs text-muted-foreground">{language}</span>
        </div>
        <Button aria-label="Copy code" variant="ghost" size="icon" onClick={copyCode}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <pre className="min-w-max p-5 font-mono text-[13px] leading-6"><code>{code}</code></pre>
      </CardContent>
    </Card>
  )
}

export { CodePanel, type CodePanelProps }
