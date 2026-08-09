import { expect, test, type Page } from "@playwright/test";
import {
  GRAPH,
  graphSettled,
  openFirstRoom,
  openPalace,
  waitForAnimations,
} from "./helpers";

/**
 * The three canvas routes fill the window.
 *
 * These are geometry tests rather than screenshots because the failure they
 * guard against is silent: a stray `mx-auto max-w-6xl`, a `PageHeader` added
 * back above a stage, or a `100vh` where `100svh` belongs all still render
 * something that looks broadly right and quietly hand a third of the screen
 * back to margins.
 */

const HEADER = 64;

/** How tall the shell's content area is, in this viewport. */
async function stageHeight(page: Page): Promise<number> {
  return page.evaluate(() => window.innerHeight);
}

/** The canvas each route is really about. */
const CANVAS = {
  graph: GRAPH,
  room: ".room-canvas-grain",
  palace: ".palace-floor",
} as const;

async function boxOf(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${selector} is laid out`).not.toBeNull();
  return box!;
}

test("the graph canvas fills what the shell leaves", async ({ page }) => {
  await openPalace(page, "./graph/");
  await graphSettled(page);

  const viewport = await stageHeight(page);
  const box = await boxOf(page, CANVAS.graph);

  // Within a couple of pixels of the viewport minus the top bar, and nothing
  // between the canvas and the bottom of the window.
  expect(box.height).toBeGreaterThan(viewport - HEADER - 4);
  expect(box.y + box.height).toBeGreaterThan(viewport - 4);
});

test("a room's canvas fills what the shell leaves", async ({ page }) => {
  await openPalace(page, "./palace/");
  await openFirstRoom(page);

  const viewport = await stageHeight(page);
  const box = await boxOf(page, CANVAS.room);

  // Inset at the top for the floating header, and padded — so this asks only
  // that the canvas is the majority of the screen rather than a 60vh box.
  expect(box.height).toBeGreaterThan((viewport - HEADER) * 0.6);
  expect(box.width).toBeGreaterThan(400);
});

test("the floor plan fills what the shell leaves", async ({ page }) => {
  await openPalace(page, "./palace/");

  const viewport = await stageHeight(page);
  const box = await boxOf(page, CANVAS.palace);

  // The old plan was a 3:2 card in a max-w-6xl column, so it could never be
  // this tall next to a 1280x720 viewport.
  expect(box.height).toBeGreaterThan((viewport - HEADER) * 0.6);
});

test("no canvas route scrolls the document", async ({ page }) => {
  // The first-run choice is answered once and stored, so only the first visit
  // goes through `openPalace` — a second call would wait for a button that
  // will never come back.
  await openPalace(page, "./palace/");

  for (const route of ["./palace/", "./graph/"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Measured at rest, not mid-flight. `.page-enter` rises the stage into
    // place, so for the length of that animation the stage — which is now
    // exactly viewport-height — sits a few pixels low and the document really
    // does gain that much scroll. That transient is the animation, not the
    // layout, and measuring inside it caught 2-8px at random.
    await waitForAnimations(page);

    const overflowing = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollHeight - root.clientHeight;
    });
    // A stage sized in `vh` rather than `svh`, or a stray margin under it,
    // shows up here as a page that scrolls with nothing to scroll to.
    expect(overflowing, `${route} does not scroll`).toBeLessThanOrEqual(1);
  }
});

test("F sends the graph fullscreen and Escape brings the chrome back", async ({
  page,
}) => {
  await openPalace(page, "./graph/");
  await graphSettled(page);

  const sidebar = page.locator("body > div > aside");
  const before = await boxOf(page, CANVAS.graph);
  await expect(sidebar).toBeVisible();

  await page.getByRole("listbox", { name: "Knowledge graph" }).focus();
  await page.keyboard.press("f");

  await expect(sidebar).toBeHidden();
  const viewport = await stageHeight(page);
  await expect
    .poll(async () => (await boxOf(page, CANVAS.graph)).height)
    .toBeGreaterThan(viewport - 4);

  await page.keyboard.press("Escape");

  await expect(sidebar).toBeVisible();
  await expect
    .poll(async () => (await boxOf(page, CANVAS.graph)).height)
    .toBeLessThanOrEqual(before.height + 1);
});

test("the fullscreen button says which way it goes", async ({ page }) => {
  await openPalace(page, "./palace/");

  const enter = page.getByRole("button", { name: "Fill the screen" });
  await expect(enter).toBeVisible();
  await enter.click();

  const leave = page.getByRole("button", { name: "Leave fullscreen" });
  await expect(leave).toBeVisible();
  await expect(leave).toHaveAttribute("aria-pressed", "true");
  await leave.click();

  await expect(enter).toBeVisible();
});

test("leaving a canvas route leaves fullscreen", async ({ page }) => {
  await openPalace(page, "./palace/");

  await page.getByRole("button", { name: "Fill the screen" }).click();
  await expect(page.locator("body > div > aside")).toBeHidden();

  // The palette is how you navigate with the sidebar gone, so this checks both
  // that it still opens in fullscreen and that arriving somewhere with no
  // canvas restores the chrome — nothing on the library would explain a
  // missing sidebar, and a client-side navigation is the case a reload hides.
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("combobox", { name: "Search" }).fill("Go to Library");

  // Results are deferred, so wait for a row that only exists once the query
  // has landed. And match the action exactly: a loose match also hits the
  // "Create “Go to Library”" offer, which sorts above it and makes a note.
  await expect(page.getByRole("option", { name: /^Create/ })).toBeVisible();
  await page
    .getByRole("option", { name: "Go to Library", exact: true })
    .click();

  await expect(page).toHaveURL(/library/);
  await expect(page.locator("body > div > aside")).toBeVisible();
});
