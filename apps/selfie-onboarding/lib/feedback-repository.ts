import {
  createDataClient,
  DrizzleFeedbackRepository,
  type FeedbackRepository,
} from "@world-lisbon/data"

let repository: FeedbackRepository | undefined

export function createFeedbackRepository(databaseUrl: string | undefined): FeedbackRepository {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for durable beta feedback")
  }
  return new DrizzleFeedbackRepository(createDataClient(databaseUrl))
}

export function getFeedbackRepository(): FeedbackRepository {
  if (repository) return repository
  repository = createFeedbackRepository(process.env.DATABASE_URL)
  return repository
}
