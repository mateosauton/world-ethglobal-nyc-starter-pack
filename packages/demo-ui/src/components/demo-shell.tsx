"use client"

import type * as React from "react"
import { ExternalLink, Radio } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

type DemoShellProps = {
  title: string
  description: string
  mode: "live" | "simulator"
  demo: React.ReactNode
  guide: React.ReactNode
  code: React.ReactNode
  repositoryUrl?: string
  error?: string
}

function DemoShell({ title, description, mode, demo, guide, code, repositoryUrl, error }: DemoShellProps) {
  const isSimulator = mode === "simulator"

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant={isSimulator ? "secondary" : "default"}>{isSimulator ? "Simulator" : "Live"}</Badge>
              <span className="font-mono text-xs text-muted-foreground">ETHGlobal Lisbon</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">{title}</h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          {repositoryUrl && <Button variant="outline" onClick={() => window.open(repositoryUrl, "_blank", "noopener,noreferrer")}><ExternalLink className="size-4" />View source</Button>}
        </header>

        {error && <Alert variant="destructive" className="mb-6"><AlertTitle>Something went wrong</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

        <Tabs defaultValue="demo">
          <TabsList aria-label="Demo sections">
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(17rem,1fr)]">
            <div className="min-w-0">
              <TabsContent value="demo"><Card><CardContent>{demo}</CardContent></Card></TabsContent>
              <TabsContent value="guide"><Card><CardContent className="prose prose-zinc max-w-none dark:prose-invert">{guide}</CardContent></Card></TabsContent>
              <TabsContent value="code">{code}</TabsContent>
            </div>

            <Card className="lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Radio className="size-4" />Runtime boundary</CardTitle>
                <CardDescription>Understand what this page can grant before testing it.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Mode</span><Badge variant={isSimulator ? "secondary" : "outline"}>{isSimulator ? "Simulator" : "Live"}</Badge></div>
                <Separator />
                <p className="leading-6 text-muted-foreground">{isSimulator ? "Fixtures demonstrate the flow but cannot grant a real benefit or persist proof use." : "Live outcomes are verified server-side before any durable state changes."}</p>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </main>
  )
}

export { DemoShell, type DemoShellProps }
