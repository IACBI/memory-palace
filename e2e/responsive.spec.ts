import { expect, test } from "@playwright/test";
import { openPalace, waitForAnimations } from "./helpers";

/**
 * What the rebuild added: a 44px touch floor, three navigation tiers, and
 * code-split overlays. None of these are visible to the axe scans — a control
 * can be perfectly labelled and still be too small to hit, and a chunk can
 * ship on every route without any page looking wrong.
 */

const HIT_MIN = 44;

test.describe("touch targets", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("controls that look small still take a 44px press", async ({ page }) => {
    await openPalace(page, "./settings/");

    // `.hit-area` keeps the visible box small and expands the *target* with a
    // centred pseudo-element, so the element's own rect is the wrong thing to
    // measure. Hit-testing a point out at the edge of where a thumb may land
    // is the property that actually matters.
    const undersized = await page.evaluate((min) => {
      const bad: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(".hit-area")) {
        const box = el.getBoundingClientRect();
        if (box.width === 0) continue;
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const reach = min / 2 - 1;
        for (const [dx, dy] of [
          [-reach, 0],
          [reach, 0],
          [0, -reach],
          [0, reach],
        ]) {
          const hit = document.elementFromPoint(cx + dx, cy + dy);
          if (!hit || (hit !== el && !el.contains(hit))) {
            bad.push(
              `${el.getAttribute("aria-label") ?? el.className} misses at ${dx},${dy}`,
            );
            break;
          }
        }
      }
      return bad;
    }, HIT_MIN);

    expect(undersized).toEqual([]);
  });

  test("the primary controls are themselves at least 44px tall", async ({
    page,
  }) => {
    await openPalace(page, "./palace/");

    const heights = await page
      .getByRole("button", { name: "Add room" })
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(heights).toBeGreaterThanOrEqual(HIT_MIN);

    // Nav rows are the other thing a thumb reaches for constantly. The drawer
    // arrives on `scale(0.98)`, so measuring it mid-entrance reports 43.5px.
    await page.getByRole("button", { name: "Open navigation" }).click();
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.waitFor({ state: "visible" });
    await waitForAnimations(page);
    for (const label of ["Dashboard", "Palace", "Library"]) {
      const box = await nav.getByRole("link", { name: label }).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(HIT_MIN);
    }
  });
});

test.describe("navigation tiers", () => {
  /** The aside is the sidebar; below `md` it is not rendered at all. */
  const sidebar = "body > div > aside";

  test("a phone gets the drawer, not a sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPalace(page, "./");

    await expect(page.locator(sidebar)).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeVisible();

    // Opening it produces exactly one Main nav, never two.
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
  });

  test("a tablet gets the icon rail, with labels still readable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await openPalace(page, "./");

    const box = await page.locator(sidebar).boundingBox();
    expect(box?.width).toBe(64);

    // The rail collapses labels with `sr-only`, never `hidden` — the icons are
    // decorative, so `hidden` would leave every link with no accessible name.
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", {
        name: "Library",
      }),
    ).toBeVisible();
  });

  test("a desktop gets the full sidebar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openPalace(page, "./");

    const box = await page.locator(sidebar).boundingBox();
    expect(box?.width).toBe(256);
    await expect(
      page.getByRole("button", { name: "Open navigation" }),
    ).toBeHidden();
  });
});

test("the first press of a shortcut opens its overlay without a wait", async ({
  page,
}) => {
  await openPalace(page, "./");

  // The overlays are code-split, so the risk this guards is a network fetch
  // sitting between the keypress and the panel. The listeners stay in
  // always-loaded code and `Overlays` warms the chunks on idle, so the very
  // first press should resolve on the same timescale as any other interaction.
  // That the code is genuinely absent from the first load is asserted at build
  // time instead, by `scripts/check-bundle.mjs` — a runtime request count
  // cannot tell a split chunk from an idle-warmed one.
  await page.keyboard.press("ControlOrMeta+k");
  await expect(
    page.getByRole("dialog", { name: "Command palette" }),
  ).toBeVisible({ timeout: 3000 });
  await page.keyboard.press("Escape");

  await page.keyboard.press("Shift+Slash");
  await expect(
    page.getByRole("dialog", { name: "Keyboard shortcuts" }),
  ).toBeVisible({ timeout: 3000 });
});
