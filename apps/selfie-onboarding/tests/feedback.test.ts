import { describe, expect, it } from "vitest"

import { InMemoryFeedbackRepository } from "@world-lisbon/data"

import { createFeedbackPostHandler } from "../app/api/feedback/route"
import { createFeedbackExportHandler } from "../app/api/feedback/export/route"
import { createFeedbackRepository } from "../lib/feedback-repository"

const feedback = {
  path: "warm",
  device: "desktop",
  osBrowser: "macOS / Chrome",
  worldAppState: "installed",
  completed: true,
  durationBucket: "30-60s",
  errorCode: null,
  retryCount: 0,
  clarityRating: 4,
  frictionRating: 2,
  privacyComprehension: "clear",
  comments: "Show a retry hint.",
} as const

describe("privacy-safe beta feedback", () => {
  it("requires durable database configuration outside injected tests", () => {
    expect(() => createFeedbackRepository(undefined)).toThrow(
      "DATABASE_URL is required",
    )
  })

  it.each(["proof", "wallet", "walletAddress", "image", "selfie", "biometric"])(
    "rejects forbidden field %s",
    async (field) => {
      const handler = createFeedbackPostHandler(new InMemoryFeedbackRepository())
      const response = await handler(
        new Request("http://demo/api/feedback", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...feedback, [field]: "sensitive" }),
        }),
      )

      expect(response.status).toBe(400)
    },
  )

  it("stores only allowlisted experience feedback", async () => {
    const repository = new InMemoryFeedbackRepository()
    const response = await createFeedbackPostHandler(repository)(
      new Request("http://demo/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(feedback),
      }),
    )

    expect(response.status).toBe(201)
    expect(await repository.list()).toHaveLength(1)
  })

  it("requires the exact admin token before exporting escaped CSV", async () => {
    const repository = new InMemoryFeedbackRepository()
    await repository.create({ ...feedback, comments: 'Good, then "great"' })
    const handler = createFeedbackExportHandler(repository, "admin-secret")

    expect((await handler(new Request("http://demo/api/feedback/export"))).status).toBe(401)
    expect(
      (
        await handler(
          new Request("http://demo/api/feedback/export", {
            headers: { authorization: "Bearer wrong" },
          }),
        )
      ).status,
    ).toBe(401)

    const response = await handler(
      new Request("http://demo/api/feedback/export", {
        headers: { authorization: "Bearer admin-secret" },
      }),
    )
    const csv = await response.text()

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("text/csv")
    expect(csv).toContain('"Good, then ""great"""')
    expect(csv).not.toMatch(/proof|wallet|image|biometric/i)
  })
})
