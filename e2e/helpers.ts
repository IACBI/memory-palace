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

/** The graph canvas itself — `main` also holds the control icons' SVGs. */
export const GRAPH = 'svg[aria-label="Knowledge graph"]';

/**
 * Waits for the force layout to stop moving.
 *
 * Nothing on the graph is interactive before its first frame: the nodes come
 * from the simulation, so until one has been painted `orderedIds` is empty and
 * every cursor move returns early without setting `aria-activedescendant`. A
 * keystroke sent before then is silently dropped, which is what made the
 * keyboard specs flaky on a loaded machine and never on a fast one.
 */
export async function graphSettled(page: Page) {
  await expect(page.locator(`${GRAPH} circle`).first()).toBeVisible();
  await page.waitForFunction((selector) => {
    const svg = document.querySelector(selector);
    if (!svg) return false;
    const key = "__lastGraphBox";
    const box = JSON.stringify(
      [...svg.querySelectorAll("circle")].map((c) => c.getBoundingClientRect()),
    );
    const store = window as unknown as Record<string, string>;
    const stable = store[key] === box;
    store[key] = box;
    return stable;
  }, GRAPH);
}

/**
 * Follows the first room link and waits for that room's canvas to fill in.
 *
 * The room reads its id from the query string on the client, so its cards
 * exist only after a navigation, a hydration and a render. `expect`'s
 * five-second default was not sized for all three: on a loaded machine it ran
 * out mid-hydration and reported an empty canvas as a product failure. The
 * budget here is for the wait, not the assertion the caller then makes — the
 * same reasoning as the raised test timeout in playwright.config.ts.
 */
export async function openFirstRoom(page: Page) {
  await page
    .getByRole("link", { name: /^Open / })
    .first()
    .click();
  await expect(objectCards(page).first()).toBeVisible({ timeout: 20_000 });
}

/** Opens the editor on the first object of the first room. */
export async function openFirstObject(page: Page) {
  await openPalace(page, "./palace/");
  await openFirstRoom(page);
  await objectCards(page).first().click();
  await expect(page.getByRole("dialog", { name: /^Edit / })).toBeVisible();
}
