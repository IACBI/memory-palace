import { expect, test } from "@playwright/test";
import { objectCards, openFirstObject } from "./helpers";

/**
 * The editor buffers free-text fields locally and writes them on a pause, so
 * the paths that used to be "every keystroke hits the store" now have to be
 * proven to still save.
 */

test("typing a title saves without touching anything else", async ({
  page,
}) => {
  await openFirstObject(page);

  const title = page.getByRole("textbox", { name: "Title" });
  await title.fill("Barrel notes");

  // The debounce has to land on its own — no blur, no close. The card behind
  // the panel reads from the store, so its label changing is proof the commit
  // happened rather than just the local buffer updating.
  await expect(
    objectCards(page).filter({ hasText: "Barrel notes" }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText("Barrel notes").first()).toBeVisible();
});

test("closing the editor flushes an in-flight edit", async ({ page }) => {
  await openFirstObject(page);

  await page.getByRole("textbox", { name: "Title" }).fill("Closed mid-edit");
  // Close immediately, well inside the debounce window.
  await page.getByRole("button", { name: "Close editor" }).click();

  await page.reload();
  await expect(page.getByText("Closed mid-edit").first()).toBeVisible();
});

test("Escape closes the editor and keeps the edit", async ({ page }) => {
  await openFirstObject(page);

  await page.getByRole("textbox", { name: "Title" }).fill("Escaped edit");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /^Edit / })).toBeHidden();

  await page.reload();
  await expect(page.getByText("Escaped edit").first()).toBeVisible();
});

test("changing the room applies at once", async ({ page }) => {
  await openFirstObject(page);

  const editor = page.getByRole("dialog", { name: /^Edit / });
  const title = await page.getByRole("textbox", { name: "Title" }).inputValue();

  await editor
    .getByRole("combobox", { name: "Room" })
    .selectOption({ label: "The Gallery" });
  await page.getByRole("button", { name: "Close editor" }).click();

  // Discrete fields commit immediately, so the object is in its new room now.
  await page.goto("./palace/");
  await page.getByRole("link", { name: "Open The Gallery" }).click();
  await expect(
    page.getByRole("button", { name: new RegExp(title) }),
  ).toBeVisible();
});
