import { expect, test } from "@playwright/test";
import { objectCards, openPalace } from "./helpers";

/**
 * Room colour used to be invisible: `paletteColor()` returned a `var()`
 * reference and call sites appended a hex alpha to it, producing CSS that is
 * invalid at computed-value time. Every tint silently fell back to
 * `transparent`. These assertions read computed styles from a real browser, so
 * they fail if that ever regresses.
 */

const TRANSPARENT = ["rgba(0, 0, 0, 0)", "transparent"];

test("room chambers render a visible palette tint", async ({ page }) => {
  await openPalace(page, "./palace/");
  const chamber = page
    .locator("div")
    .filter({ has: page.getByRole("link", { name: /^Open / }) })
    .last();
  await expect(chamber).toBeVisible();

  const background = await chamber.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(TRANSPARENT).not.toContain(background);
});

test("a room's icon chip is tinted, not transparent", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page
    .getByRole("link", { name: /^Open / })
    .first()
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  // The icon chip sits immediately before the room title.
  const chip = page
    .locator("main span")
    .filter({ has: page.locator("svg") })
    .first();
  const background = await chip.evaluate(
    (el) => getComputedStyle(el).backgroundColor,
  );
  expect(TRANSPARENT).not.toContain(background);
});

test("object cards carry a tinted border", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page
    .getByRole("link", { name: /^Open / })
    .first()
    .click();

  const card = objectCards(page).first();
  await expect(card).toBeVisible();

  const borderColor = await card.evaluate(
    (el) => getComputedStyle(el).borderTopColor,
  );
  expect(TRANSPARENT).not.toContain(borderColor);
});
