import { expect, test } from "@playwright/test";
import {
  openFirstObject,
  openFirstRoom,
  openPalace,
  ROUTES,
  scan,
} from "./helpers";

/**
 * Automated checks catch roughly a third of accessibility defects, so these
 * scans sit alongside the keyboard journeys below rather than replacing them.
 */
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
  await openFirstRoom(page);
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
