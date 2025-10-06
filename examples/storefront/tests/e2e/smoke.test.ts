/**
 * Basic smoke test for the storefront.
 */

import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PhilJS/);
  await expect(page.locator("h1")).toContainText("PhilJS");
});

test("can navigate to product page", async ({ page }) => {
  await page.goto("/");

  // Click first product link
  await page.locator('a[href^="/products/"]').first().click();

  // Should be on product page
  await expect(page).toHaveURL(/\/products\/\d+/);
  await expect(page.locator("h1")).toBeVisible();
});

test("product page has add to cart button", async ({ page }) => {
  await page.goto("/products/1");

  await expect(page.locator('button:has-text("Add to cart")')).toBeVisible();
});

test("quantity updates total price", async ({ page }) => {
  await page.goto("/products/1");

  const qty = page.locator("[data-phil-qty]");
  const total = page.locator("[data-phil-total]");

  await qty.fill("3");
  await expect(total).toHaveText("3899.97");
});
