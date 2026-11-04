import { test, expect } from "@playwright/test";

test("filters live results, preserves full counts and defaults to All after reload", async ({ page }) => {
  await page.goto("/");
  const filter = (name: string) => page.getByRole("button", { name, exact: true });
  const counts = page.getByRole("status", { name: "Task counts" });
  await expect(filter("All")).toHaveAttribute("aria-pressed", "true");
  for (const text of ["Write shopping list", "Pay bill"]) {
    await page.getByLabel("Add a task", { exact: true }).fill(text);
    await page.getByRole("button", { name: "Add task" }).click();
  }
  await page.getByRole("checkbox", { name: "Pay bill" }).check();
  await filter("Active").click();
  await expect(filter("Active")).toHaveAttribute("aria-pressed", "true");
  await expect(filter("All")).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(page.getByRole("checkbox", { name: "Write shopping list" })).toBeVisible();
  await expect(counts).toHaveText("2 total · 1 active · 1 completed");
  await filter("Completed").click();
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await expect(counts).toHaveText("2 total · 1 active · 1 completed");
  await page.getByRole("checkbox", { name: "Pay bill" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "No completed tasks yet." })).toBeVisible();
  await page.getByLabel("Add a task", { exact: true }).fill("Water plants");
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("status", { name: "Task feedback" })).toHaveText("Added “Water plants” as an active task. Select Active or All to see it.");
  await expect(filter("Completed")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await filter("Active").click();
  await expect(page.getByRole("checkbox", { name: "Water plants" })).not.toBeChecked();
  for (const text of ["Write shopping list", "Pay bill", "Water plants"]) {
    await page.getByRole("checkbox", { name: text }).click();
    await expect(page.getByRole("checkbox", { name: text })).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { name: "No active tasks." })).toBeVisible();
  await expect(counts).toHaveText("3 total · 0 active · 3 completed");
  await page.reload();
  await expect(filter("All")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("checkbox")).toHaveCount(3);
  await expect(counts).toHaveText("3 total · 0 active · 3 completed");
  for (const checkbox of await page.getByRole("checkbox").all()) await expect(checkbox).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("provides empty states and keyboard filter selection without writing storage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Add a task", { exact: true })).toBeEnabled();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error("Filters must not write storage"); };
  });
  const active = page.getByRole("button", { name: "Active", exact: true });
  await active.focus();
  await page.keyboard.press("Enter");
  await expect(active).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { name: "No active tasks." })).toBeVisible();
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "No completed tasks yet." })).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByRole("heading", { name: "A fresh start." })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
});

test("does not announce success for a failed addition in Completed", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await page.getByLabel("Add a task", { exact: true }).fill("Unsaved plants");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  });
  await page.getByRole("button", { name: "Add task" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be saved");
  await expect(page.getByRole("status", { name: "Task feedback" })).toBeEmpty();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("0 total · 0 active · 0 completed");
});
