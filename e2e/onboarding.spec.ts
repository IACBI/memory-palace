import { expect, test } from "@playwright/test";
import { openFresh } from "./helpers";

/**
 * A first-time visitor used to inherit six sample rooms with no indication
 * they were a demo. They now choose.
 */

test("offers a choice on first visit", async ({ page }) => {
  await openFresh(page, "./");
  await expect(
    page.getByRole("heading", { name: /welcome to your/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /explore a sample palace/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /start empty/i }),
  ).toBeVisible();
});

test("choosing the sample palace fills the floor plan", async ({ page }) => {
  await openFresh(page, "./");
  await page.getByRole("button", { name: /explore a sample palace/i }).click();

  await expect(page.getByText(/\d+ rooms · \d+ objects/)).toBeVisible();

  await page.goto("./palace/");
  await expect(
    page.getByRole("link", { name: /^Open / }).first(),
  ).toBeVisible();
});

test("choosing empty leaves the palace blank, and the choice sticks", async ({
  page,
}) => {
  await openFresh(page, "./");
  await page.getByRole("button", { name: /start empty/i }).click();

  await expect(page.getByText("Your palace is empty.")).toBeVisible();

  // The choice is persisted, so a reload must not ask again.
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /welcome to your/i }),
  ).toBeHidden();
  await expect(page.getByText("Your palace is empty.")).toBeVisible();
});

test("an empty palace guides the visitor to create a room", async ({
  page,
}) => {
  await openFresh(page, "./");
  await page.getByRole("button", { name: /start empty/i }).click();

  await page.goto("./palace/");
  await expect(
    page.getByRole("heading", { name: /an empty floor plan/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /create a room/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("the chrome and headings render before the store is read", async ({
  page,
  baseURL,
}) => {
  // JavaScript disabled: whatever is in the HTML is all the visitor gets.
  // Before the shell became a Server Component this page was a lone spinner.
  const context = await page
    .context()
    .browser()!
    .newContext({ javaScriptEnabled: false, baseURL });
  const noJs = await context.newPage();
  await noJs.goto("./palace/");

  await expect(noJs.getByRole("heading", { level: 1 })).toHaveText(
    "The Palace",
  );
  await expect(noJs.getByRole("navigation")).toBeVisible();
  await context.close();
});
