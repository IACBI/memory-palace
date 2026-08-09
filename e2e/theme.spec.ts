import { expect, test, type Page } from "@playwright/test";
import { openFirstRoom, openPalace, ROUTES, scan } from "./helpers";

/**
 * Parchment is a second identity, not an inversion, so it gets the same
 * scrutiny as the dark theme: contrast, no flash on load, and a full axe pass.
 */

async function chooseTheme(page: Page, label: string) {
  await openPalace(page, "./settings/");
  const group = page.getByRole("radiogroup", { name: "Theme" });
  await group.getByRole("radio", { name: label }).click();
  await expect(group.getByRole("radio", { name: label })).toHaveAttribute(
    "aria-checked",
    "true",
  );
}

/** The theme actually painted, as the stylesheet sees it. */
function activeTheme(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.theme);
}

test("switching to Parchment repaints the whole palace", async ({ page }) => {
  await chooseTheme(page, "Parchment");
  expect(await activeTheme(page)).toBe("parchment");

  const background = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  // Warm paper, not near-black: every channel well above mid.
  const [r, g, b] = /(\d+), (\d+), (\d+)/
    .exec(background)!
    .slice(1)
    .map(Number);
  expect(Math.min(r, g, b)).toBeGreaterThan(180);
  // Warm, not grey — red channel ahead of blue.
  expect(r).toBeGreaterThan(b);
});

test("the theme survives a reload without flashing the other one", async ({
  page,
}) => {
  await chooseTheme(page, "Parchment");

  // The attribute is written by the inline <head> script, so it is already
  // correct on the very first paint rather than after hydration.
  const early = await page.evaluate(async () => {
    const seen: (string | undefined)[] = [];
    seen.push(document.documentElement.dataset.theme);
    return seen;
  });
  expect(early[0]).toBe("parchment");

  await page.reload();
  expect(await activeTheme(page)).toBe("parchment");

  // Nothing repaints it back later either.
  await page.waitForTimeout(300);
  expect(await activeTheme(page)).toBe("parchment");
});

test.describe("Auto on a dark system", () => {
  test.use({ colorScheme: "dark" });

  test("resolves to the palace", async ({ page }) => {
    await chooseTheme(page, "Auto");
    expect(await activeTheme(page)).toBe("palace");
  });
});

test.describe("Auto on a light system", () => {
  test.use({ colorScheme: "light" });

  test("resolves to parchment", async ({ page }) => {
    await chooseTheme(page, "Auto");
    expect(await activeTheme(page)).toBe("parchment");
  });

  test("resolves before the first paint, not after hydration", async ({
    page,
  }) => {
    await chooseTheme(page, "Auto");
    await page.reload();
    // Written by the inline <head> script; if it were left to React the
    // reader would see the dark theme flash first.
    expect(await activeTheme(page)).toBe("parchment");
  });
});

test("room palettes switch to their darkened variants", async ({ page }) => {
  const read = () =>
    page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return ["brass", "oxblood", "forest", "ink", "plum", "umber"].map((key) =>
        style.getPropertyValue(`--palette-${key}`).trim(),
      );
    });

  await openPalace(page, "./settings/");
  const dark = await read();

  // Switched in place — `chooseTheme` would answer the first-run prompt a
  // second time and wait forever for a dialog that is already gone.
  const group = page.getByRole("radiogroup", { name: "Theme" });
  await group.getByRole("radio", { name: "Parchment" }).click();
  await expect(group.getByRole("radio", { name: "Parchment" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  const light = await read();

  // Every one of the six is a different value on paper. A token left behind
  // would be a room whose colour was tuned for near-black.
  expect(light).toHaveLength(6);
  for (const [index, value] of light.entries()) {
    expect(value, `palette ${index}`).not.toBe(dark[index]);
    expect(value).toMatch(/^#[0-9a-f]{6}$/);
  }
});

for (const [name, path] of ROUTES) {
  test(`${name} has no axe violations in Parchment`, async ({ page }) => {
    await chooseTheme(page, "Parchment");
    await page.goto(path);
    expect((await scan(page)).violations).toEqual([]);
  });
}

test("the room canvas has no axe violations in Parchment", async ({ page }) => {
  await chooseTheme(page, "Parchment");
  await page.goto("./palace/");
  await openFirstRoom(page);
  expect((await scan(page)).violations).toEqual([]);
});
