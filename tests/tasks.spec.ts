import { test, expect } from "@playwright/test";

const STORAGE_KEY = "azilll.tasks.v1";

test("captures trimmed tasks, validates blanks, completes and reopens with full counts", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Add a task", { exact: true })).toBeEnabled();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("0 total · 0 active · 0 completed");
  await page.getByLabel("Add a task", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Enter a task before adding it.");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("0 total · 0 active · 0 completed");
  await page.getByLabel("Add a task", { exact: true }).fill("  Buy groceries  ");
  await page.getByLabel("Add a task", { exact: true }).press("Enter");
  await expect(page.getByRole("checkbox", { name: "Buy groceries", exact: true })).not.toBeChecked();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("1 total · 1 active · 0 completed");
  await page.getByRole("checkbox", { name: "Buy groceries" }).check();
  await expect(page.getByRole("checkbox", { name: "Buy groceries" })).toBeChecked();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("1 total · 0 active · 1 completed");
  await page.getByRole("checkbox", { name: "Buy groceries" }).uncheck();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("1 total · 1 active · 0 completed");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("adds tasks and persists completed and reopened tasks after reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "A fresh start." })).toBeVisible();
  await page.getByLabel("Add a task", { exact: true }).fill("Buy groceries");
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByLabel("Add a task", { exact: true }).fill("Read a book");
  await page.getByRole("button", { name: "Add task" }).click();
  await page.getByRole("checkbox", { name: "Buy groceries" }).check();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Buy groceries" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Read a book" })).not.toBeChecked();
  await expect(page.getByText("1 of 2 complete")).toBeVisible();
  await page.getByRole("checkbox", { name: "Buy groceries" }).uncheck();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Buy groceries" })).not.toBeChecked();
});

test("rejects blank tasks and treats markup as plain text", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Add a task", { exact: true }).fill("   ");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Enter a task before adding it.");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  const markup = "<script>alert('test')</script><img src=x onerror=alert(1)>";
  await page.getByLabel("Add a task", { exact: true }).fill(markup);
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("checkbox", { name: markup })).toBeVisible();
  await expect(page.locator(".task-list script, .task-list img")).toHaveCount(0);
});

test("does not overwrite unreadable saved data", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "broken-json"), STORAGE_KEY);
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your stored data has not been changed");
  await expect(page.getByRole("button", { name: "Add task" })).toBeDisabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe("broken-json");
});

test("failed saves do not claim an unsaved task was added", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Add a task", { exact: true }).fill("Unsaved task");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  });
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your change could not be saved");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByLabel("Add a task", { exact: true })).toHaveValue("Unsaved task");
});
