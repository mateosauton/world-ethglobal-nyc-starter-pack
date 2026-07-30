import { AlertCircle, CheckCircle2, Circle, LoaderCircle } from "lucide-react"

import { cn } from "../lib/utils"

type EventStatus = "pending" | "active" | "success" | "error"

type TimelineEvent = {
  id: string
  title: string
  description?: string
  status: EventStatus
  metadata?: string
}

type EventTimelineProps = {
  events: TimelineEvent[]
  className?: string
}

const icons = {
  pending: Circle,
  active: LoaderCircle,
  success: CheckCircle2,
  error: AlertCircle,
}

function EventTimeline({ events, className }: EventTimelineProps) {
  return (
    <ol aria-label="Trust events" className={cn("space-y-0", className)}>
      {events.map((event, index) => {
        const Icon = icons[event.status]
        return (
          <li key={event.id} className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-6 last:pb-0">
            {index < events.length - 1 && <span aria-hidden className="absolute left-[0.59375rem] top-5 h-[calc(100%-1rem)] w-px bg-border" />}
            <Icon aria-hidden className={cn("relative z-10 mt-0.5 size-5 bg-card text-muted-foreground", event.status === "active" && "animate-spin text-foreground", event.status === "success" && "text-emerald-600", event.status === "error" && "text-destructive")} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium">{event.title}</p>
                {event.metadata && <span className="font-mono text-xs text-muted-foreground">{event.metadata}</span>}
              </div>
              {event.description && <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export { EventTimeline, type EventStatus, type EventTimelineProps, type TimelineEvent }
