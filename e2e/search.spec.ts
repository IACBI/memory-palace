import { expect, test, type Page } from "@playwright/test";
import { openPalace } from "./helpers";

/**
 * The sample palace contains "Hot sauce ferment — batch 3 log", which the old
 * search could only find by typing a single contiguous substring of it.
 */
const MULTI_WORD_TARGET = "Hot sauce ferment";

async function openPaletteWith(page: Page, query: string) {
  await page.keyboard.press("ControlOrMeta+k");
  const dialog = page.getByRole("dialog", { name: "Command palette" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("combobox").fill(query);
  return dialog;
}

/** The "N objects" summary above the library results. */
async function libraryCount(page: Page): Promise<number> {
  const summary = page.getByText(/^\d+ objects?/).first();
  const text = await summary.textContent();
  return Number(/^\d+/.exec(text ?? "")?.[0] ?? -1);
}

test("a query whose words are scattered through the title still finds it", async ({
  page,
}) => {
  await openPalace(page, "./");
  const dialog = await openPaletteWith(page, "ferment log");

  await expect(
    dialog.getByRole("option", { name: new RegExp(MULTI_WORD_TARGET) }),
  ).toBeVisible();
});

test("every matched word is marked in the result", async ({ page }) => {
  await openPalace(page, "./");
  const dialog = await openPaletteWith(page, "ferment log");

  const option = dialog
    .getByRole("option", { name: new RegExp(MULTI_WORD_TARGET) })
    .first();
  await expect(option.locator("mark")).toHaveText(["ferment", "log"]);
});

test("adding a word narrows the results rather than widening them", async ({
  page,
}) => {
  await openPalace(page, "./library/");
  const search = page.getByLabel("Search objects");

  await search.fill("ferment");
  const broad = await libraryCount(page);

  await search.fill("ferment batch");
  const narrow = await libraryCount(page);

  expect(broad).toBeGreaterThan(1);
  expect(narrow).toBeGreaterThan(0);
  expect(narrow).toBeLessThan(broad);
});

test("a typo still surfaces the object, as a low-ranked fuzzy hit", async ({
  page,
}) => {
  await openPalace(page, "./");
  const dialog = await openPaletteWith(page, "enchirdion");

  await expect(
    dialog.getByRole("option", { name: /Enchiridion/ }),
  ).toBeVisible();
});

test("a search that finds nothing offers to create it", async ({ page }) => {
  await openPalace(page, "./");
  const dialog = await openPaletteWith(page, "Quarterly retro notes");

  await expect(
    dialog.getByRole("option", { name: /Create .Quarterly retro notes./ }),
  ).toBeVisible();

  await page.keyboard.press("Enter");

  // Lands in the editor on the newly created object, already titled.
  const editor = page.getByRole("dialog", { name: /^Edit / });
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel("Title")).toHaveValue("Quarterly retro notes");
});

test("the library marks the matched words in each title", async ({ page }) => {
  await openPalace(page, "./library/");
  await page.getByLabel("Search objects").fill("ferment");

  const marked = page.getByRole("main").locator("mark").first();
  await expect(marked).toBeVisible();
  await expect(marked).toHaveText(/ferment/i);
});
