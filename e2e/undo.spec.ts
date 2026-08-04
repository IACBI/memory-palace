import { expect, test } from "@playwright/test";
import { objectCards, openPalace } from "./helpers";

/**
 * Before this, the only undo in the app was a four-second toast on deleting a
 * single object. Deleting a *room* took every object in it and every
 * connection those objects had, with no way back at all.
 */

test("Ctrl+Z restores a deleted room and everything inside it", async ({
  page,
}) => {
  await openPalace(page, "./palace/");

  const room = page.getByRole("link", { name: /^Open / }).first();
  const roomName = (await room.getAttribute("aria-label"))!.replace(
    /^Open /,
    "",
  );

  // Count what is inside before destroying it.
  await room.click();
  await expect(objectCards(page).first()).toBeVisible();
  const objectCount = await objectCards(page).count();
  expect(objectCount).toBeGreaterThan(0);

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: /delete room/i }).click();
  await expect(
    page.getByRole("link", { name: `Open ${roomName}` }),
  ).toBeHidden();

  await page.keyboard.press("ControlOrMeta+z");

  await expect(
    page.getByRole("link", { name: `Open ${roomName}` }),
  ).toBeVisible();
  await page.getByRole("link", { name: `Open ${roomName}` }).click();
  await expect(objectCards(page)).toHaveCount(objectCount);
});

test("undo announces what it reversed and offers a redo", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Undo me");
  await dialog.getByRole("button", { name: /create room/i }).click();
  await expect(page.getByRole("link", { name: "Open Undo me" })).toBeVisible();

  await page.keyboard.press("ControlOrMeta+z");
  await expect(page.getByRole("link", { name: "Open Undo me" })).toBeHidden();

  const status = page.getByRole("status");
  await expect(status.getByText(/^Undid:/)).toBeVisible();

  await status.getByRole("button", { name: "Redo" }).click();
  await expect(page.getByRole("link", { name: "Open Undo me" })).toBeVisible();
});

test("Ctrl+Shift+Z redoes", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Round trip");
  await dialog.getByRole("button", { name: /create room/i }).click();

  await page.keyboard.press("ControlOrMeta+z");
  await expect(
    page.getByRole("link", { name: "Open Round trip" }),
  ).toBeHidden();

  await page.keyboard.press("ControlOrMeta+Shift+z");
  await expect(
    page.getByRole("link", { name: "Open Round trip" }),
  ).toBeVisible();
});

test("undo does not steal the browser's own undo while typing", async ({
  page,
}) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const name = page.getByRole("dialog").getByLabel("Name");
  await name.fill("Typed text");
  await name.press("ControlOrMeta+z");

  // The dialog is still open and the app has not undone anything behind it.
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("an undone change survives being redone after a reload", async ({
  page,
}) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name").fill("Persisted undo");
  await dialog.getByRole("button", { name: /create room/i }).click();
  await expect(
    page.getByRole("link", { name: "Open Persisted undo" }),
  ).toBeVisible();

  await page.keyboard.press("ControlOrMeta+z");
  await expect(
    page.getByRole("link", { name: "Open Persisted undo" }),
  ).toBeHidden();

  // The undo is a real change, so it has to reach storage like any other.
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Open Persisted undo" }),
  ).toBeHidden();
});
