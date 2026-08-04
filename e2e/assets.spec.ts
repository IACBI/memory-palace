import { expect, test } from "@playwright/test";

/**
 * Metadata assets are easy to break on a subpath deployment: Next emits the
 * `app/icon.tsx` link without the base path, so it 404s on GitHub Pages while
 * working perfectly on localhost. These fetch the URLs the browser is actually
 * told to use.
 */

test("every URL referenced in <head> resolves", async ({ page, request }) => {
  await page.goto("./");

  const hrefs = await page.evaluate(() =>
    Array.from(document.head.querySelectorAll<HTMLLinkElement>("link[href]"))
      .filter((el) => ["icon", "apple-touch-icon", "manifest"].includes(el.rel))
      .map((el) => el.href),
  );

  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs) {
    const response = await request.get(href);
    expect(response.status(), `${href} should resolve`).toBeLessThan(400);
  }
});

test("the open graph image resolves and is a PNG", async ({
  page,
  request,
}) => {
  await page.goto("./");
  const ogUrl = await page.evaluate(
    () =>
      document
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content") ?? null,
  );
  expect(ogUrl).toBeTruthy();

  // The absolute URL points at the production origin; only the path is ours.
  const response = await request.get(new URL(ogUrl!).pathname);
  expect(response.status()).toBeLessThan(400);

  // Assert the bytes, not the content-type header: metadata routes export as
  // extensionless files, so what a given static host labels them is its own
  // business. The PNG signature is the thing that actually has to be true.
  const bytes = await response.body();
  expect([...bytes.subarray(0, 4)]).toEqual([0x89, 0x50, 0x4e, 0x47]);
});

test("robots and sitemap are published", async ({ request, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    const url = new URL(baseURL!).pathname.replace(/\/$/, "") + path;
    const response = await request.get(origin + url);
    expect(response.status(), `${url} should resolve`).toBeLessThan(400);
  }
});
