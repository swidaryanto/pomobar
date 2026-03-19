import { expect, test } from '@playwright/test';

const parseTime = (value: string) => {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Unexpected timer format: ${value}`);
  }
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  return minutes * 60 + seconds;
};

test('loads main UI', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('NOW:')).toBeVisible();
  await expect(page.getByText('Reset timer')).toBeVisible();
  await expect(page.locator('.timer-clock')).toBeVisible();
});

test('timer starts and pauses', async ({ page }) => {
  await page.goto('/');

  const timer = page.locator('.timer-clock');
  const playButton = page.locator('.control-button--accent');

  const before = parseTime(await timer.innerText());
  await playButton.click();
  await page.waitForTimeout(1200);
  const afterStart = parseTime(await timer.innerText());
  expect(afterStart).toBeLessThan(before);

  await playButton.click();
  const paused = parseTime(await timer.innerText());
  await page.waitForTimeout(1200);
  const afterPause = parseTime(await timer.innerText());
  expect(afterPause).toBe(paused);
});

test('theme toggle switches body dataset', async ({ page }) => {
  await page.goto('/');

  const settingsButton = page.getByRole('button', { name: /Settings|Close settings/i });
  await settingsButton.click();

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Analog' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'analog');
});
