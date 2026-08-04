import { expect, test } from "@playwright/test";
import { openFirstObject, openPalace } from "./helpers";

/** Switches the open object to the "link" type. */
async function selectLinkType(page: import("@playwright/test").Page) {
  await page
    .getByRole("dialog", { name: /^Edit / })
    .getByRole("group", { name: "Type" })
    .getByRole("button", { name: "Link" })
    .click();
}

test("a content security policy is present", async ({ page }) => {
  await page.goto("./");
  const policy = await page.evaluate(
    () =>
      document
        .querySelector('meta[http-equiv="Content-Security-Policy"]')
        ?.getAttribute("content") ?? null,
  );

  expect(policy).toBeTruthy();
  expect(policy).toContain("default-src 'self'");
  expect(policy).toContain("object-src 'none'");
});

test("an unsafe link is shown as a warning, never as an anchor", async ({
  page,
}) => {
  await openFirstObject(page);

  // Make it a link object, then give it a scheme the app must refuse.
  await selectLinkType(page);
  await page
    .getByRole("textbox", { name: "URL" })
    .fill("javascript:alert(document.domain)");

  const editor = page.getByRole("dialog", { name: /^Edit / });
  await expect(editor.getByText(/scheme the app won't open/i)).toBeVisible();
  await expect(editor.locator('a[href^="javascript:"]')).toHaveCount(0);
});

test("a safe link renders as a real anchor", async ({ page }) => {
  await openFirstObject(page);

  await selectLinkType(page);
  await page
    .getByRole("textbox", { name: "URL" })
    .fill("https://example.com/page");

  const editor = page.getByRole("dialog", { name: /^Edit / });
  const anchor = editor.locator('a[href="https://example.com/page"]');
  await expect(anchor).toBeVisible();
  await expect(anchor).toHaveAttribute("rel", /noreferrer/);
});

test("a scheme-less address is upgraded to https rather than pointing inward", async ({
  page,
}) => {
  await openFirstObject(page);

  await selectLinkType(page);
  await page.getByRole("textbox", { name: "URL" }).fill("example.com/docs");

  await expect(
    page
      .getByRole("dialog", { name: /^Edit / })
      .locator('a[href="https://example.com/docs"]'),
  ).toBeVisible();
});

test("importing a malformed file leaves the palace untouched", async ({
  page,
}) => {
  await openPalace(page, "./settings/");

  // Writes are debounced, so wait for the palace to actually reach storage
  // before snapshotting it.
  await page.waitForFunction(
    () => localStorage.getItem("memory-palace-data:v1") !== null,
  );
  const before = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("memory-palace-data:v1")!),
  );

  await page.locator('input[type="file"]').setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from("{ this is not json"),
  });

  await expect(page.getByText(/valid JSON/i)).toBeVisible();

  const after = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("memory-palace-data:v1")!),
  );
  expect(after.rooms.length).toBe(before.rooms.length);
  expect(after.objects.length).toBe(before.objects.length);
});

test("a repairable import lists what will change before applying", async ({
  page,
}) => {
  await openPalace(page, "./settings/");

  // One object pointing at a room that is not in the file.
  const payload = {
    version: 1,
    rooms: [],
    objects: [
      {
        id: "o1",
        roomId: "missing-room",
        type: "note",
        title: "Stray note",
        content: "",
        tags: [],
        position: { x: 50, y: 50 },
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    connections: [],
    activity: [],
    settings: { accent: "brass", textSize: "medium", reduceMotion: false },
  };

  await page.locator('input[type="file"]').setInputFiles({
    name: "repairable.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(payload)),
  });

  const dialog = page.getByRole("dialog", { name: /import this palace/i });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/will be repaired on import/i)).toBeVisible();
  await expect(dialog.getByText(/moved to Unfiled/i)).toBeVisible();
});
