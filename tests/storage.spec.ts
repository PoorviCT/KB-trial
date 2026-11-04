import { test, expect } from "@playwright/test";

const STORAGE_KEY = "azilll.tasks.v1";

for (const [description, savedValue] of [
  ["invalid JSON", "not json"],
  ["non-array data", JSON.stringify({ text: "Plan dinner" })],
  ["invalid completion state", JSON.stringify([{ id: "1", text: "Plan dinner", isComplete: "yes" }])],
  ["blank text", JSON.stringify([{ id: "1", text: "   ", isComplete: false }])],
  ["duplicate IDs", JSON.stringify([{ id: "1", text: "A", isComplete: false }, { id: "1", text: "B", isComplete: true }])],
]) {
  test(`protects ${description} without claiming it was saved`, async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: STORAGE_KEY, value: savedValue });
    await page.goto("/");
    await expect(page.getByRole("main").getByRole("alert")).toContainText("Your stored data has not been changed");
    await expect(page.getByText("Saved in this browser.", { exact: false })).toHaveCount(0);
    await expect(page.getByLabel("Add a task", { exact: true })).toBeDisabled();
    await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("0 total · 0 active · 0 completed");
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(savedValue);
  });
}

test("shows an explicit read error when storage access throws", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Denied", "SecurityError"); };
  });
  await page.goto("/");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Your stored data has not been changed");
  await expect(page.getByText("Saved in this browser.", { exact: false })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Add task" })).toBeDisabled();
});

test("retains saved tasks on a failed toggle and recovers on retry", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Add a task", { exact: true }).fill("Plan dinner");
  await page.getByRole("button", { name: "Add task" }).click();
  const savedValue = await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
  await page.evaluate(() => {
    const realSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      Storage.prototype.setItem = realSetItem;
      throw new DOMException(`Cannot save ${key} ${value.length}`, "QuotaExceededError");
    };
  });
  await page.getByRole("checkbox", { name: "Plan dinner" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be saved");
  await expect(page.getByRole("checkbox", { name: "Plan dinner" })).not.toBeChecked();
  await expect(page.getByText("Saved in this browser.", { exact: false })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(savedValue);
  await page.getByRole("checkbox", { name: "Plan dinner" }).check();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Saved in this browser.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Plan dinner" })).toBeChecked();
});

test("restores a mixed list and full counts across completion and reopening reloads", async ({ page }) => {
  await page.goto("/");
  for (const text of ["Plan dinner", "Book appointment"]) {
    await page.getByLabel("Add a task", { exact: true }).fill(text);
    await page.getByRole("button", { name: "Add task" }).click();
  }
  await page.getByRole("checkbox", { name: "Book appointment" }).check();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Plan dinner" })).not.toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Book appointment" })).toBeChecked();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("2 total · 1 active · 1 completed");
  await page.getByRole("checkbox", { name: "Book appointment" }).uncheck();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Book appointment" })).not.toBeChecked();
  await expect(page.getByRole("status", { name: "Task counts" })).toHaveText("2 total · 2 active · 0 completed");
});
