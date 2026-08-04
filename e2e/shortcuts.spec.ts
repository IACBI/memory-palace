import { expect, test } from "@playwright/test";
import { openPalace } from "./helpers";

const sheet = "dialog";

test("? opens the cheatsheet and ? closes it again", async ({ page }) => {
  await openPalace(page, "./");

  await page.keyboard.press("Shift+Slash");
  const dialog = page.getByRole(sheet, { name: "Keyboard shortcuts" });
  await expect(dialog).toBeVisible();

  await page.keyboard.press("Shift+Slash");
  await expect(dialog).toBeHidden();
});

test("the cheatsheet separates global keys from canvas keys", async ({
  page,
}) => {
  await openPalace(page, "./");
  await page.keyboard.press("Shift+Slash");

  const dialog = page.getByRole(sheet, { name: "Keyboard shortcuts" });
  await expect(dialog.getByRole("heading", { name: "Anywhere" })).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Room canvas" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Knowledge graph" }),
  ).toBeVisible();

  // Undo has no on-screen affordance at all, so the sheet is the only place a
  // user can find it.
  await expect(dialog.getByText("Undo the last change")).toBeVisible();

  // The arrow keys belong to the canvas group, not the global one.
  const anywhere = dialog.locator("section", {
    has: page.getByRole("heading", { name: "Anywhere" }),
  });
  await expect(anywhere.getByText("Move the object")).toBeHidden();
});

test("? is ignored while typing, so the character reaches the field", async ({
  page,
}) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const name = page.getByRole(sheet).getByLabel("Name");
  await name.fill("Why");
  await name.press("Shift+Slash");

  await expect(
    page.getByRole(sheet, { name: "Keyboard shortcuts" }),
  ).toBeHidden();
  await expect(name).toHaveValue("Why?");
});

test("the sidebar offers the cheatsheet to people who never press ?", async ({
  page,
}) => {
  await openPalace(page, "./");

  await page.getByRole("button", { name: "Keyboard shortcuts ?" }).click();
  await expect(
    page.getByRole(sheet, { name: "Keyboard shortcuts" }),
  ).toBeVisible();

  // Escape unwinds the top of the overlay stack.
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole(sheet, { name: "Keyboard shortcuts" }),
  ).toBeHidden();
});

test("the cheatsheet stacks over another dialog and unwinds in order", async ({
  page,
}) => {
  await openPalace(page, "./palace/");
  await page.getByRole("button", { name: /add room/i }).click();

  const roomDialog = page.getByRole(sheet, { name: /new room/i });
  await expect(roomDialog).toBeVisible();

  // Focus is inside the dialog but not in a text field.
  await page.getByRole("button", { name: "Close dialog" }).first().focus();
  await page.keyboard.press("Shift+Slash");

  const shortcuts = page.getByRole(sheet, { name: "Keyboard shortcuts" });
  await expect(shortcuts).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(shortcuts).toBeHidden();
  await expect(roomDialog).toBeVisible();
});

test("settings shows the same reference as the cheatsheet", async ({
  page,
}) => {
  await openPalace(page, "./settings/");

  const main = page.getByRole("main");
  await expect(
    main.getByRole("heading", { name: "Keyboard shortcuts" }),
  ).toBeVisible();
  await expect(main.getByRole("heading", { name: "Anywhere" })).toBeVisible();
  await expect(main.getByText("Undo the last change")).toBeVisible();
  await expect(main.getByText("Open the command palette")).toBeVisible();
});
