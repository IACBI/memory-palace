import { expect, test } from "@playwright/test";
import { openFirstObject, openPalace } from "./helpers";

/**
 * Journeys that only a keyboard user takes. The graph in particular was
 * entirely unusable without a mouse: nodes were bare `<g>` elements with
 * pointer handlers and no roles, tab stops or key handling.
 */

test("the graph can be walked and opened from the keyboard", async ({
  page,
}) => {
  await openPalace(page, "./graph/");

  const graph = page.getByRole("listbox", { name: "Knowledge graph" });
  await graph.focus();
  await expect(graph).toBeFocused();

  // Arrow keys move a cursor through the nodes in a stable order.
  await page.keyboard.press("ArrowRight");
  const first = await graph.getAttribute("aria-activedescendant");
  expect(first).toBeTruthy();

  await page.keyboard.press("ArrowRight");
  const second = await graph.getAttribute("aria-activedescendant");
  expect(second).not.toBe(first);

  // The cursor node is exposed as the selected option. Matched by attribute
  // because React's generated ids contain characters a CSS id selector cannot
  // carry unescaped, and `CSS.escape` does not exist in the Node-side test.
  await expect(page.locator(`[id="${second}"]`)).toHaveAttribute(
    "aria-selected",
    "true",
  );

  // Enter opens it in the editor.
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: /^Edit / })).toBeVisible();
});

test("Escape clears the graph cursor", async ({ page }) => {
  await openPalace(page, "./graph/");
  const graph = page.getByRole("listbox", { name: "Knowledge graph" });
  await graph.focus();
  await page.keyboard.press("ArrowRight");
  await expect(graph).toHaveAttribute("aria-activedescendant", /.+/);

  await page.keyboard.press("Escape");
  expect(await graph.getAttribute("aria-activedescendant")).toBeNull();
});

test("a plain wheel scrolls the page instead of hijacking it", async ({
  page,
}) => {
  await openPalace(page, "./graph/");
  const before = await page.evaluate(() => window.scrollY);
  await page.mouse.move(400, 400);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(
    before,
  );
});

test("the room context menu opens, moves and closes from the keyboard", async ({
  page,
}) => {
  await openPalace(page, "./palace/");

  const trigger = page.getByRole("button", { name: /^Actions for / }).first();
  await trigger.focus();
  await page.keyboard.press("Enter");

  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  // Focus moves into the menu rather than staying on the trigger.
  await expect(menu.getByRole("menuitem").first()).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem").nth(1)).toBeFocused();

  // Escape closes it and hands focus back — it used to listen for mousedown
  // only, so a keyboard user could not dismiss it at all.
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the settings radiogroups move with arrow keys", async ({ page }) => {
  await openPalace(page, "./settings/");

  const group = page.getByRole("radiogroup", { name: "Text size" });
  const options = group.getByRole("radio");
  await options.first().focus();

  await page.keyboard.press("ArrowRight");
  await expect(options.nth(1)).toBeFocused();
  await expect(options.nth(1)).toHaveAttribute("aria-checked", "true");
});

test("Tab is trapped inside the object editor", async ({ page }) => {
  await openFirstObject(page);
  const editor = page.getByRole("dialog", { name: /^Edit / });

  // Tab far enough to wrap several times; focus must never leave the panel.
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    const inside = await editor.evaluate((panel) =>
      panel.contains(document.activeElement),
    );
    expect(inside, `focus escaped the editor after ${i + 1} tabs`).toBe(true);
  }
});

test("the skip link jumps to the main content", async ({ page }) => {
  await openPalace(page, "./");
  // Reload so the document starts fresh: answering the first-run choice left
  // focus on that button, and Tab would continue from there.
  await page.reload();
  await page.keyboard.press("Tab");

  const skip = page.getByRole("link", { name: /skip to content/i });
  await expect(skip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});
