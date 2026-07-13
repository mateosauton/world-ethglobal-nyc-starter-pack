import { expect, test } from "@playwright/test";

const demos = [
  { port: 3000, heading: "One-per-human free trial" },
  { port: 3001, heading: "Selfie Check legacy beta" },
  { port: 3002, heading: "AgentKit human-backed API access" },
  { port: 3003, heading: "World ID 4 credential policy lab" }
] as const;

for (const demo of demos) {
  test(`${demo.heading} renders its builder workflow`, async ({ page }) => {
    await page.goto(`http://127.0.0.1:${demo.port}`);

    await expect(page.getByRole("heading", { name: demo.heading })).toBeVisible();
    await expect(page.getByText("Simulator", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Demo" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    await page.getByRole("tab", { name: "Guide" }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();

    await page.getByRole("tab", { name: "Code" }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  });
}
