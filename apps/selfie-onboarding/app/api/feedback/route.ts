import { parseSelfieFeedback, type FeedbackRepository } from "@world-lisbon/data"

import { getFeedbackRepository } from "../../../lib/feedback-repository"

export function createFeedbackPostHandler(repository: FeedbackRepository) {
  return async function handleFeedback(request: Request): Promise<Response> {
    try {
      const feedback = parseSelfieFeedback(await request.json())
      const saved = await repository.create(feedback)
      return Response.json({ id: saved.id, createdAt: saved.createdAt }, { status: 201 })
    } catch {
      return Response.json(
        { code: "invalid_feedback", message: "Submit only the documented experience fields." },
        { status: 400 },
      )
    }
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    return await createFeedbackPostHandler(getFeedbackRepository())(request)
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
