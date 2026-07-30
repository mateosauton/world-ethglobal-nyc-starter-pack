import { authorizeAdminToken, type FeedbackRepository, type SavedSelfieFeedback } from "@world-lisbon/data"

import { getFeedbackRepository } from "../../../../lib/feedback-repository"

function csvCell(value: string | number | boolean | Date | null | undefined): string {
  if (value == null) return ""
  const text = value instanceof Date ? value.toISOString() : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(rows: SavedSelfieFeedback[]): string {
  const fields = [
    "id",
    "createdAt",
    "path",
    "device",
    "osBrowser",
    "worldAppState",
    "completed",
    "durationBucket",
    "errorCode",
    "retryCount",
    "clarityRating",
    "frictionRating",
    "privacyComprehension",
    "comments",
  ] as const
  return [fields.join(","), ...rows.map((row) => fields.map((field) => csvCell(row[field])).join(","))].join("\n")
}

export function createFeedbackExportHandler(repository: FeedbackRepository, expectedToken: string | undefined) {
  return async function handleExport(request: Request): Promise<Response> {
    const authorization = request.headers.get("authorization")
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined
    if (!authorizeAdminToken(token, expectedToken)) {
      return Response.json({ code: "unauthorized" }, { status: 401 })
    }

    const csv = toCsv(await repository.list())
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="selfie-check-feedback.csv"',
      },
    })
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    return await createFeedbackExportHandler(
      getFeedbackRepository(),
      process.env.FEEDBACK_ADMIN_TOKEN,
    )(request)
  } catch (error) {
    return Response.json(
      {
        code: "database_not_configured",
        message: error instanceof Error ? error.message : "Feedback storage is unavailable",
      },
      { status: 503 },
    )
  }
}
