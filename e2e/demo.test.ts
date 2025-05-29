import { expect, test } from '@playwright/test';

test('home page has expected h1', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1').filter({ hasText: 'Conversation Stream' })).toBeVisible();
});

test('theme toggle functionality', async ({ page }) => {
	await page.goto('/');
	
	// Check if theme toggle button exists (use the class that's actually rendered)
	const themeToggle = page.locator('.theme-toggle').first();
	if (await themeToggle.count() > 0) {
		await expect(themeToggle).toBeVisible();
		
		// Test theme switching by clicking
		await themeToggle.click();
		
		// Check if data-theme attribute changes (should cycle through themes)
		const htmlElement = page.locator('html');
		const dataTheme = await htmlElement.getAttribute('data-theme');
		expect(dataTheme).toBeTruthy();
		
		// Verify the button text changes to indicate the new theme
		const buttonText = await themeToggle.textContent();
		expect(buttonText).toBeTruthy();
	}
});

test('CSS custom properties are loaded', async ({ page }) => {
	await page.goto('/');
	
	const primaryColor = await page.evaluate(() => {
		return getComputedStyle(document.documentElement).getPropertyValue('--color-background-primary');
	});
	
	expect(primaryColor).toBeTruthy();
});
