import { test, expect } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1').filter({ hasText: 'Conversation Stream' }).first()).toBeVisible();
});

test('settings modal opens and closes correctly', async ({ page }) => {
	await page.goto('/');

	// Step 1: Find and click the settings button
	const settingsButton = page.locator('button[aria-label="Settings"]').first();
	await expect(settingsButton).toBeVisible();
	await settingsButton.click();

	// Step 2: Verify settings modal opens
	const modal = page.locator('[role="dialog"]');
	await expect(modal).toBeVisible();

	// Step 3: Check modal content
	await expect(modal.locator('h2')).toContainText('Settings');

	// Step 4: Close modal by clicking close button
	const closeButton = modal.locator('button[aria-label="Close settings"]');
	await closeButton.click();

	// Step 5: Verify modal is closed
	await expect(modal).not.toBeVisible();
});

test('CSS custom properties are loaded', async ({ page }) => {
	await page.goto('/');

	// Check if CSS custom properties are available
	const backgroundColorProperty = await page.evaluate(() => {
		return getComputedStyle(document.documentElement).getPropertyValue(
			'--color-background-primary'
		);
	});

	expect(backgroundColorProperty).toBeTruthy();
});
