import { test } from "@playwright/test";
import { openPalace } from "./helpers";

test("probe", async ({ page }) => {
  await openPalace(page, "./palace/");
  await page.keyboard.press("ControlOrMeta+k");
  await page.waitForTimeout(300);
  console.log(
    "focused:",
    await page.evaluate(() => {
      const a = document.activeElement as HTMLElement | null;
      return a
        ? `${a.tagName}#${a.id}[${a.getAttribute("role") ?? ""}]`
        : "none";
    }),
  );
  await page.keyboard.type("lab");
  await page.waitForTimeout(300);
  console.log(
    "inputValue:",
    await page.evaluate(() => {
      const i = document.querySelector(
        'input[role="combobox"]',
      ) as HTMLInputElement | null;
      return i?.value ?? "NO COMBOBOX";
    }),
  );
  console.log("options:", await page.getByRole("option").count());
  console.log(
    "paletteText:",
    (
      await page.getByRole("dialog", { name: "Command palette" }).innerText()
    ).slice(0, 200),
  );
});
