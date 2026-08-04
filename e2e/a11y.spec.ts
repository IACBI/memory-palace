import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { objectCards, openFirstObject, openPalace } from "./helpers";

/**
 * Automated checks catch roughly a third of accessibility defects, so these
 * scans sit alongside the keyboard journeys below rather than replacing them.
 */
async function scan(page: Page) {
  // Entrance animations fade opacity in from 0. Scanning mid-flight reports
  // every element as a contrast failure against its half-composited colour,
  // which says nothing about the interface at rest.
  // Skeleton shimmers loop forever, so only finite animations are waited on.
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => {
      const iterations = animation.effect?.getComputedTiming().iterations ?? 1;
      return iterations === Infinity || animation.playState !== "running";
    }),
  );
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

const ROUTES = [
  ["dashboard", "./"],
  ["palace", "./palace/"],
  ["library", "./library/"],
  ["graph", "./graph/"],
  ["settings", "./settings/"],
] as const;

for (const [name, path] of ROUTES) {
  test(`${name} has no axe violations`, async ({ page }) => {
    await openPalace(page, path);
    const results = await scan(page);
    expect(results.violations).toEqual([]);
  });
}

test("the room canvas has no axe violations", async ({ page }) => {
  // Reached by navigation rather than by URL: the route needs a room id, and
  // this is the screen the whole product is built around.
  await openPalace(page, "./palace/");
  await page
    .getByRole("link", { name: /^Open / })
    .first()
    .click();
  await expect(objectCards(page).first()).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test("the first-run screen has no axe violations", async ({ page }) => {
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: /explore a sample palace/i }),
  ).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test("the command palette has no axe violations", async ({ page }) => {
  await openPalace(page, "./");
  await page.keyboard.press("ControlOrMeta+k");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test("the object editor has no axe violations", async ({ page }) => {
  await openFirstObject(page);
  expect((await scan(page)).violations).toEqual([]);
});

test("the shortcut cheatsheet has no axe violations", async ({ page }) => {
  await openPalace(page, "./");
  await page.keyboard.press("Shift+Slash");
  await expect(
    page.getByRole("dialog", { name: "Keyboard shortcuts" }),
  ).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});

test("the room dialog has no axe violations", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});
