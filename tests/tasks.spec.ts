import { test, expect } from "@playwright/test";

const STORAGE_KEY = "azilll.tasks.v1";

test("adds tasks and preserves completion across reloads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("No tasks yet")).toBeVisible();
  await page.getByLabel("New task").fill("  Buy groceries  ");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(page.getByLabel("New task")).toHaveValue("");
  await page.getByLabel("New task").fill("Read a chapter");
  await page.getByLabel("New task").press("Enter");
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Buy groceries", exact: true })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Read a chapter", exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Buy groceries", exact: true }).check();
  await expect(page.getByText("1 of 2 complete", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Buy groceries", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Read a chapter", exact: true })).not.toBeChecked();
  await page.getByRole("checkbox", { name: "Buy groceries", exact: true }).uncheck();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Buy groceries", exact: true })).not.toBeChecked();
});

test("rejects whitespace-only tasks", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("New task").fill("   ");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Enter a task before adding it.");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});

test("does not overwrite unreadable stored tasks", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "not-json"), STORAGE_KEY);
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your saved tasks could not be loaded");
  await expect(page.getByLabel("New task")).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe("not-json");
});

test("reports failed saves without pretending a task was saved", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Storage full", "QuotaExceededError"); };
  });
  await page.goto("/");
  await page.getByLabel("New task").fill("Important task");
  await page.getByRole("button", { name: "Add task", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your change could not be saved");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByLabel("New task")).toHaveValue("Important task");
});
