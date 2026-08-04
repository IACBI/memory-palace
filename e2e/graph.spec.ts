import { expect, test } from "@playwright/test";
import { GRAPH, graphSettled as settled, openPalace } from "./helpers";

test("every node ends up inside the canvas", async ({ page }) => {
  await openPalace(page, "./graph/");
  await settled(page);

  // A force layout has no obligation to stay in the box it started in, and a
  // palace with unconnected objects used to settle with nodes off-screen.
  const outside = await page.evaluate((selector) => {
    const svg = document.querySelector(selector)!;
    const frame = svg.getBoundingClientRect();
    return [...svg.querySelectorAll("circle")].filter((circle) => {
      const box = circle.getBoundingClientRect();
      if (box.width === 0) return false;
      return (
        box.right < frame.left ||
        box.left > frame.right ||
        box.bottom < frame.top ||
        box.top > frame.bottom
      );
    }).length;
  }, GRAPH);
  expect(outside).toBe(0);
});

test("the most connected objects are named without hovering", async ({
  page,
}) => {
  await openPalace(page, "./graph/");
  await settled(page);

  // A graph where nothing is labelled until you point at it is a decoration.
  const labels = page.locator(`${GRAPH} text`);
  expect(await labels.count()).toBeGreaterThan(0);
});

test("connections are drawn as curves", async ({ page }) => {
  await openPalace(page, "./graph/");
  await settled(page);

  const paths = page.locator(`${GRAPH} path[stroke]`);
  expect(await paths.count()).toBeGreaterThan(0);
  // Quadratic segments — straight chords collapse into a star in a cluster.
  await expect(paths.first()).toHaveAttribute("d", /Q/);
});

test("node size grows with connections, but sub-linearly", async ({ page }) => {
  await openPalace(page, "./graph/");
  await settled(page);

  const radii = await page.evaluate(
    (selector) =>
      [...document.querySelectorAll(`${selector} circle`)]
        .map((circle) => Number(circle.getAttribute("r")))
        .filter((r) => Number.isFinite(r) && r > 0),
    GRAPH,
  );

  const smallest = Math.min(...radii);
  const largest = Math.max(...radii);
  expect(largest).toBeGreaterThan(smallest);
  // The old linear scale turned a well-connected node into a blob that
  // crowded everything else off the canvas.
  expect(largest).toBeLessThan(smallest * 6);
});

test("Fit brings the view back after zooming away", async ({ page }) => {
  await openPalace(page, "./graph/");
  await settled(page);

  await page.getByRole("listbox", { name: "Knowledge graph" }).focus();
  await page.keyboard.press("+");
  await page.keyboard.press("+");
  await page.keyboard.press("+");

  await page.getByRole("button", { name: "Fit everything on screen" }).click();

  const outside = await page.evaluate((selector) => {
    const node = document.querySelector(selector)!;
    const frame = node.getBoundingClientRect();
    return [...node.querySelectorAll("circle")].filter((circle) => {
      const box = circle.getBoundingClientRect();
      if (box.width === 0) return false;
      return box.right < frame.left || box.left > frame.right;
    }).length;
  }, GRAPH);
  expect(outside).toBe(0);
});
