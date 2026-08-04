import { expect, type Page } from "@playwright/test";

/**
 * Opens a route with the sample palace loaded.
 *
 * Every Playwright test gets a fresh context, so storage is always empty and
 * the first-run choice always appears. Waiting for it and answering it is
 * therefore deterministic — checking `isVisible()` immediately after `goto`
 * races hydration and silently leaves the dialog open.
 */
export async function openPalace(page: Page, path = "./") {
  await page.goto(path);

  const sample = page.getByRole("button", {
    name: /explore a sample palace/i,
  });
  await expect(sample).toBeVisible();
  await sample.click();
  await expect(sample).toBeHidden();
}

/** Opens a route without answering the first-run choice. */
export async function openFresh(page: Page, path = "./") {
  await page.goto(path);
}

/**
 * The draggable object cards on a room canvas.
 *
 * Located by their `aria-describedby` link to the canvas instructions, which
 * is what distinguishes them from every other button on the page and does not
 * depend on their label text.
 */
export function objectCards(page: Page) {
  return page.locator('main [role="button"][aria-describedby]');
}

/** Opens the editor on the first object of the first room. */
export async function openFirstObject(page: Page) {
  await openPalace(page, "./palace/");
  await page
    .getByRole("link", { name: /^Open / })
    .first()
    .click();
  await objectCards(page).first().click();
  await expect(page.getByRole("dialog", { name: /^Edit / })).toBeVisible();
}
