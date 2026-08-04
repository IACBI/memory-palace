import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../helpers";

/**
 * The worker's precache scraper, read out of the shipped file.
 *
 * `public/sw.js` is not a module and runs in a worker scope, so the pattern
 * cannot be imported. Lifting the literal out of the source keeps this test
 * honest: it exercises the regex that actually ships, not a copy of it.
 */
function assetPattern(): RegExp {
  const source = readFileSync(join(REPO_ROOT, "public", "sw.js"), "utf8");
  const literal = source.match(/const ASSET_PATTERN =\s*\/(.*)\/([a-z]*);/);
  expect(literal, "ASSET_PATTERN should be a regex literal").not.toBeNull();
  return new RegExp(literal![1], literal![2]);
}

/** What `precacheDocument` does with each capture. */
function scrape(html: string, base = "https://example.test/memory-palace/") {
  return [...html.matchAll(assetPattern())].map(
    ([, href]) => new URL(href, base).href,
  );
}

describe("the worker's asset scraper", () => {
  it("reads a plain attribute", () => {
    const html = `<script src="/memory-palace/_next/static/chunks/a.js"></script>`;
    expect(scrape(html)).toEqual([
      "https://example.test/memory-palace/_next/static/chunks/a.js",
    ]);
  });

  it("reads a CSS url() and a single-quoted attribute", () => {
    const html = `<style>@font-face{src:url(/memory-palace/_next/static/media/f.woff2)}</style><link href='/memory-palace/_next/static/css/a.css'>`;
    expect(scrape(html)).toEqual([
      "https://example.test/memory-palace/_next/static/media/f.woff2",
      "https://example.test/memory-palace/_next/static/css/a.css",
    ]);
  });

  /**
   * Next writes the RSC payload into the document as a JS string literal, so
   * every URL inside it is delimited by `\"` rather than `"`. A character class
   * that accepts the closing backslash captures it, and `new URL()` normalises
   * a trailing `\` to `/` — which asked the network for `chunk.js/` on every
   * install and 404ed. Sixteen URLs per export build were fetched this way.
   */
  it("does not swallow the backslash of an escaped quote", () => {
    const html = `<script>self.__next_f.push([1,"a:[\\"$\\",\\"link\\",null,{\\"href\\":\\"/memory-palace/_next/static/chunks/b.js\\"}]"])</script>`;
    const scraped = scrape(html);

    expect(scraped).not.toContain(
      "https://example.test/memory-palace/_next/static/chunks/b.js/",
    );
    for (const url of scraped) {
      expect(url, `${url} should not end in a slash`).not.toMatch(/\/$/);
    }
  });

  it("still finds the asset when the payload is the only mention", () => {
    const html = `<script>self.__next_f.push([1,"{\\"src\\":\\"/memory-palace/_next/static/chunks/c.js\\"}"])</script>`;
    expect(scrape(html)).toContain(
      "https://example.test/memory-palace/_next/static/chunks/c.js",
    );
  });
});
