import { expect, test, type Page } from "@playwright/test";
import { objectCards, openFirstRoom, openPalace } from "./helpers";

/**
 * The product sells itself as a *spatial* tool, but until this the only way to
 * relate two objects was a dropdown in a side panel.
 */

/** The visible connection curves, excluding the wide invisible hit targets. */
function curves(page: Page) {
  return page.locator('main path[stroke]:not([stroke="transparent"])');
}

/** The invisible wide strokes that make thin curves clickable. */
function hitTargets(page: Page) {
  return page.locator('main path[stroke="transparent"]');
}

async function openRoomCanvas(page: Page) {
  await openPalace(page, "./palace/");
  await openFirstRoom(page);
  expect(await objectCards(page).count()).toBeGreaterThan(1);
  // The layer needs the canvas measured before it can draw anything.
  await expect(hitTargets(page).first()).toBeAttached();
}

/**
 * Clicks a point that genuinely lies on the nth curve.
 *
 * A curve's bounding-box centre is not on the curve, so clicking the element
 * the way Playwright normally would lands on whatever is behind it.
 */
async function clickCurve(page: Page, index = 0) {
  const point = await page.evaluate((n) => {
    const paths = [
      ...document.querySelectorAll('main path[stroke="transparent"]'),
    ] as SVGPathElement[];
    const path = paths[n];
    const rect = path.ownerSVGElement!.getBoundingClientRect();
    const at = path.getPointAtLength(path.getTotalLength() * 0.5);
    return { x: rect.left + at.x, y: rect.top + at.y };
  }, index);
  await page.mouse.click(point.x, point.y);
}

test("existing connections are drawn on the canvas", async ({ page }) => {
  await openRoomCanvas(page);

  // The sample palace links three objects inside its first room.
  expect(await hitTargets(page).count()).toBeGreaterThan(0);
  await expect(
    page.locator("main text", { hasText: "builds on" }),
  ).toBeVisible();
});

test("dragging from a card's handle to another card connects them", async ({
  page,
}) => {
  await openRoomCanvas(page);

  const before = await curves(page).count();
  const cards = objectCards(page);

  // The last two cards are the pair the sample data leaves unlinked.
  const count = await cards.count();
  const handle = cards.nth(count - 1).locator("[data-link-handle]");
  const handleBox = (await handle.boundingBox())!;
  const targetBox = (await cards.nth(count - 2).boundingBox())!;

  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    targetBox.x + targetBox.width / 2,
    targetBox.y + targetBox.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();

  await expect(page.getByRole("status").getByText(/^Connected/)).toBeVisible();
  await expect(curves(page)).toHaveCount(before + 1);
});

test("L then Enter connects two objects from the keyboard", async ({
  page,
}) => {
  await openRoomCanvas(page);

  const before = await curves(page).count();
  const cards = objectCards(page);
  const count = await cards.count();

  await cards.nth(count - 1).focus();
  await page.keyboard.press("l");
  await expect(page.getByText(/choose another object/)).toBeVisible();

  await cards.nth(count - 2).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText(/choose another object/)).toBeHidden();
  await expect(curves(page)).toHaveCount(before + 1);
});

test("Escape abandons a link in progress without connecting anything", async ({
  page,
}) => {
  await openRoomCanvas(page);

  const before = await curves(page).count();
  await objectCards(page).nth(0).focus();
  await page.keyboard.press("l");
  await expect(page.getByText(/choose another object/)).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByText(/choose another object/)).toBeHidden();
  await expect(curves(page)).toHaveCount(before);
});

test("a new connection survives a reload", async ({ page }) => {
  await openRoomCanvas(page);

  const before = await curves(page).count();
  const cards = objectCards(page);
  const count = await cards.count();

  await cards.nth(count - 1).focus();
  await page.keyboard.press("l");
  await cards.nth(count - 2).focus();
  await page.keyboard.press("Enter");
  await expect(curves(page)).toHaveCount(before + 1);

  await page.reload();
  await expect(objectCards(page).first()).toBeVisible();
  await expect(curves(page)).toHaveCount(before + 1);
});

test("clicking a curve offers to remove it", async ({ page }) => {
  await openRoomCanvas(page);
  const before = await curves(page).count();

  await clickCurve(page);

  const remove = page.getByRole("button", { name: "Remove this connection" });
  await expect(remove).toBeVisible();

  await remove.click();
  await expect(remove).toBeHidden();
  await expect(curves(page)).toHaveCount(before - 1);
});

test("Ctrl+Z brings a removed connection back", async ({ page }) => {
  await openRoomCanvas(page);
  const before = await curves(page).count();

  await clickCurve(page);
  await page.getByRole("button", { name: "Remove this connection" }).click();
  await expect(curves(page)).toHaveCount(before - 1);

  await page.keyboard.press("ControlOrMeta+z");
  await expect(curves(page)).toHaveCount(before);
});

test("a connection to another room is drawn as a stub, not a line to nowhere", async ({
  page,
}) => {
  await openPalace(page, "./palace/");

  // The Conservatory holds objects linked to the Study and the Archive.
  await page.getByRole("link", { name: "Open The Conservatory" }).click();
  await expect(objectCards(page).first()).toBeVisible();

  // Attached rather than visible: an axis-aligned stub is a zero-width box,
  // which Playwright's visibility heuristic counts as hidden.
  const stub = page.locator("main path[stroke-dasharray]").first();
  await expect(stub).toBeAttached();
  await expect(stub).toHaveAttribute("d", /^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
});
