import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1').filter({ hasText: 'Conversation Stream' })).toBeVisible();
});

test('settings modal opens and closes correctly', async ({ page }) => {
	await page.goto('/');
	
	// Step 1: Find and click the settings button
	const settingsButton = page.locator('button[aria-label="Settings"]');
	await expect(settingsButton).toBeVisible();
	await settingsButton.click();
	
	// Step 2: Verify settings modal opens
	const settingsModal = page.locator('[role="dialog"][aria-labelledby="settings-title"]');
	await expect(settingsModal).toBeVisible();
	
	// Step 3: Verify modal title
	const modalTitle = page.locator('#settings-title');
	await expect(modalTitle).toHaveText('Settings');
	
	// Step 4: Verify theme toggle is visible
	const themeToggle = page.locator('.theme-toggle');
	await expect(themeToggle).toBeVisible();
	
	// Step 5: Close modal by clicking close button
	const closeButton = page.locator('.modal-close');
	await expect(closeButton).toBeVisible();
	await closeButton.click();
	
	// Step 6: Verify modal closes
	await expect(settingsModal).not.toBeVisible();
});

test('settings modal and theme toggle functionality', async ({ page }) => {
	await page.goto('/');
	
	// Step 1: Find and click the settings button
	const settingsButton = page.locator('button[aria-label="Settings"]');
	await expect(settingsButton).toBeVisible();
	await settingsButton.click();
	
	// Step 2: Verify settings modal opens
	const settingsModal = page.locator('[role="dialog"][aria-labelledby="settings-title"]');
	await expect(settingsModal).toBeVisible();
	
	// Step 3: Find the theme toggle inside the modal
	const themeToggle = page.locator('.theme-toggle');
	await expect(themeToggle).toBeVisible();
	
	// Step 4: Get initial theme state and button text
	const initialDataTheme = await page.locator('html').getAttribute('data-theme');
	const initialButtonText = await themeToggle.textContent();
	expect(initialDataTheme).toBeTruthy();
	expect(initialButtonText).toBeTruthy();
	
	// Step 5: Click theme toggle to change theme
	await themeToggle.click();
	
	// Step 6: Wait a moment for the change to take effect
	await page.waitForTimeout(100);
	
	// Step 7: Verify theme actually changed (data-theme OR button text should change)
	const newDataTheme = await page.locator('html').getAttribute('data-theme');
	const newButtonText = await themeToggle.textContent();
	
	// At least one of these should have changed
	const themeChanged = newDataTheme !== initialDataTheme;
	const buttonTextChanged = newButtonText !== initialButtonText;
	
	expect(themeChanged || buttonTextChanged).toBe(true);
	
	// Step 8: Close modal
	const closeButton = page.locator('.modal-close');
	await closeButton.click();
	await expect(settingsModal).not.toBeVisible();
});

test('CSS custom properties are loaded', async ({ page }) => {
	await page.goto('/');
	
	const primaryColor = await page.evaluate(() => {
		return getComputedStyle(document.documentElement).getPropertyValue('--color-background-primary');
	});
	
	expect(primaryColor).toBeTruthy();
});
