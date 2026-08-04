import { expect, test } from "@playwright/test";
import { openPalace } from "./helpers";

/**
 * Baseline flows that must keep working through every refactor. Runs against
 * both the server build and the static export (see playwright.config.ts).
 */

test("dashboard renders the seeded palace", async ({ page }) => {
  await openPalace(page, "./");
  await expect(page.getByText(/\d+ rooms · \d+ objects/)).toBeVisible();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: "Palace" }),
  ).toBeVisible();
});

test("navigates from the dashboard into a room", async ({ page }) => {
  await openPalace(page, "./palace/");
  const firstRoom = page.getByRole("link", { name: /^Open / }).first();
  await expect(firstRoom).toBeVisible();
  const roomName = (await firstRoom.getAttribute("aria-label"))!.replace(
    /^Open /,
    "",
  );
  await firstRoom.click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(roomName);
});

test("command palette opens, searches, and closes on Escape", async ({
  page,
}) => {
  await openPalace(page, "./");
  await page.keyboard.press("ControlOrMeta+k");

  const palette = page.getByRole("dialog", { name: "Command palette" });
  await expect(palette).toBeVisible();

  // Focus lands in the search field without a manual click.
  await page.keyboard.type("lab");
  await expect(palette.getByText(/laboratory/i).first()).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(palette).toBeHidden();
});

test("creates a room and it survives a reload", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Observatory");
  await dialog.getByRole("button", { name: /create room/i }).click();

  await expect(
    page.getByRole("link", { name: "Open Observatory" }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("link", { name: "Open Observatory" }),
  ).toBeVisible();
});

test("every route responds without a client error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await openPalace(page, "./");
  for (const route of ["./palace/", "./library/", "./graph/", "./settings/"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }

  expect(errors).toEqual([]);
});
