import { test, expect } from "@playwright/test"

/**
 * Sprint 1 acceptance test: a logged-in user with a Madrid trip opens /mapa
 * and sees at least 3 numbered markers plus a route polyline.
 *
 * Credentials come from env (never committed):
 *   E2E_EMAIL=... E2E_PASSWORD=... pnpm test:e2e
 * The account must own a trip whose activities have coordinates.
 */
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

test("mapa renders ≥3 markers and a route for a Madrid trip", async ({ page }) => {
  test.skip(!email || !password, "E2E_EMAIL / E2E_PASSWORD not set")

  await page.goto("/login?next=/mapa")
  await page.getByPlaceholder("tu@email.com").fill(email!)
  await page.getByPlaceholder("••••••••").fill(password!)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await page.waitForURL("**/mapa", { timeout: 30_000 })

  // Markers are numbered divIcons rendered by Leaflet
  const markers = page.locator(".leaflet-marker-icon")
  await expect(markers.nth(2)).toBeVisible({ timeout: 30_000 })
  expect(await markers.count()).toBeGreaterThanOrEqual(3)

  // Per-day route polyline in the overlay pane
  await expect(page.locator(".leaflet-overlay-pane path").first()).toBeVisible()
})
