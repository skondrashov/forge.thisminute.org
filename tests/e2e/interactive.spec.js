// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Interactive — Theme Toggle', () => {

  test('clicking theme toggle switches between light and dark', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const isLightBefore = await page.evaluate(() => document.body.classList.contains('light-mode'));

    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);

    const isLightAfter = await page.evaluate(() => document.body.classList.contains('light-mode'));
    expect(isLightAfter).toBe(!isLightBefore);

    // Toggle back
    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);

    const isLightRestored = await page.evaluate(() => document.body.classList.contains('light-mode'));
    expect(isLightRestored).toBe(isLightBefore);
  });

  test('theme choice persists in localStorage', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Set to light mode
    const isLight = await page.evaluate(() => document.body.classList.contains('light-mode'));
    if (!isLight) {
      await page.locator('#theme-btn').click();
      await page.waitForTimeout(200);
    }

    const storedTheme = await page.evaluate(() => localStorage.getItem('thisminute_theme'));
    expect(storedTheme).toBe('light');

    // Toggle to dark
    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);
    const storedDark = await page.evaluate(() => localStorage.getItem('thisminute_theme'));
    expect(storedDark).toBe('dark');
  });

  test('theme persists across page reload', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Force light mode
    const isLight = await page.evaluate(() => document.body.classList.contains('light-mode'));
    if (!isLight) {
      await page.locator('#theme-btn').click();
      await page.waitForTimeout(200);
    }

    // Reload
    await page.reload({ waitUntil: 'networkidle' });
    const isLightAfterReload = await page.evaluate(() => document.body.classList.contains('light-mode'));
    expect(isLightAfterReload).toBe(true);
  });

  test('sun/moon icons switch with theme', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Force to dark mode (default)
    const isLight = await page.evaluate(() => document.body.classList.contains('light-mode'));
    if (isLight) {
      await page.locator('#theme-btn').click();
      await page.waitForTimeout(200);
    }

    // In dark mode, moon should be visible, sun hidden
    const moonDisplay = await page.locator('#icon-moon').evaluate(el => el.style.display);
    const sunDisplay = await page.locator('#icon-sun').evaluate(el => el.style.display);
    expect(moonDisplay).not.toBe('none');
    expect(sunDisplay).toBe('none');

    // Switch to light mode
    await page.locator('#theme-btn').click();
    await page.waitForTimeout(200);

    const moonDisplayLight = await page.locator('#icon-moon').evaluate(el => el.style.display);
    const sunDisplayLight = await page.locator('#icon-sun').evaluate(el => el.style.display);
    expect(moonDisplayLight).toBe('none');
    expect(sunDisplayLight).toBe('block');
  });
});

test.describe('Interactive — Mobile Hamburger Nav', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hamburger button is visible on mobile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const hamburger = page.locator('.nav-hamburger');
    await expect(hamburger).toBeVisible();
  });

  test('clicking hamburger opens and closes the dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const hamburger = page.locator('.nav-hamburger');
    const dropdown = page.locator('.site-nav-dropdown');

    // Should start closed
    await expect(dropdown).not.toHaveClass(/open/);

    // Open
    await hamburger.click();
    await page.waitForTimeout(200);
    await expect(dropdown).toHaveClass(/open/);

    // Close via close button
    await page.locator('.nav-close').click();
    await page.waitForTimeout(200);
    await expect(dropdown).not.toHaveClass(/open/);
  });

  test('clicking a nav link in the dropdown closes it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const hamburger = page.locator('.nav-hamburger');
    const dropdown = page.locator('.site-nav-dropdown');

    await hamburger.click();
    await page.waitForTimeout(200);
    await expect(dropdown).toHaveClass(/open/);

    // Click a nav link
    await dropdown.locator('a[href="/models/"]').click();
    await page.waitForTimeout(500);
    await expect(dropdown).not.toHaveClass(/open/);
  });

  test('Escape closes the mobile dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.locator('.nav-hamburger').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.site-nav-dropdown')).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    await expect(page.locator('.site-nav-dropdown')).not.toHaveClass(/open/);
  });

  test('clicking the scrim closes the mobile dropdown', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    await page.locator('.nav-hamburger').click();
    await page.waitForTimeout(200);

    await page.locator('.nav-scrim').click({ force: true });
    await page.waitForTimeout(200);
    await expect(page.locator('.site-nav-dropdown')).not.toHaveClass(/open/);
  });
});

test.describe('Interactive — Homepage', () => {

  test('anatomy diagram nodes are clickable links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const modelNode = page.locator('.anatomy__node.node--model');
    await expect(modelNode).toBeVisible();
    const modelHref = await modelNode.getAttribute('href');
    expect(modelHref).toBe('/models/');

    const contextNode = page.locator('.anatomy__node.node--context');
    await expect(contextNode).toBeVisible();
    const contextHref = await contextNode.getAttribute('href');
    expect(contextHref).toBe('/context/');

    const toolsNode = page.locator('.anatomy__node.node--tools');
    await expect(toolsNode).toBeVisible();
    const toolsHref = await toolsNode.getAttribute('href');
    expect(toolsHref).toBe('/tools/');
  });

  test('orchestration box is a clickable link to /orchestration/', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const orchBox = page.locator('.orchestration-box');
    await expect(orchBox).toBeVisible();
    const href = await orchBox.getAttribute('href');
    expect(href).toBe('/orchestration/');
  });

  test('forge link at the bottom navigates to /forge/', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const forgeLink = page.locator('.forge-link');
    await expect(forgeLink).toBeVisible();
    const href = await forgeLink.getAttribute('href');
    expect(href).toBe('/forge/');
  });

  test('hero h1 is visible and says "LLMs!"', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const h1 = page.locator('.hero h1');
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText('LLMs!');
  });

  test('no console errors on home page', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe('Interactive — Forge Page', () => {

  test('security notice details element opens and closes', async ({ page }) => {
    await page.goto('/forge/', { waitUntil: 'networkidle' });

    const details = page.locator('.security-notice');
    await expect(details).toBeVisible();

    // Should start closed
    const isOpen = await details.evaluate(el => el.open);
    expect(isOpen).toBe(false);

    // Click summary to open
    await details.locator('summary').click();
    await page.waitForTimeout(200);
    const isOpenAfter = await details.evaluate(el => el.open);
    expect(isOpenAfter).toBe(true);

    // Click again to close
    await details.locator('summary').click();
    await page.waitForTimeout(200);
    const isOpenFinal = await details.evaluate(el => el.open);
    expect(isOpenFinal).toBe(false);
  });

  test('getting started code block renders properly', async ({ page }) => {
    await page.goto('/forge/', { waitUntil: 'networkidle' });

    const pre = page.locator('.content pre');
    await expect(pre).toBeVisible();

    const codeText = await pre.textContent();
    expect(codeText).toContain('git clone');
    expect(codeText).toContain('agent-forge');
  });

  test('role cards are visible (4 roles)', async ({ page }) => {
    await page.goto('/forge/', { waitUntil: 'networkidle' });

    const roleCards = page.locator('.role-card');
    const count = await roleCards.count();
    expect(count).toBe(4);

    // Check all are visible
    for (let i = 0; i < count; i++) {
      await expect(roleCards.nth(i)).toBeVisible();
    }
  });

  test('no console errors on forge page', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/forge/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe('Interactive — Context Page', () => {

  test('token demo controls are present', async ({ page }) => {
    await page.goto('/context/', { waitUntil: 'networkidle' });

    const resetBtn = page.locator('#rbtn');
    const stepBtn = page.locator('#sbtn');
    const playBtn = page.locator('#pbtn');

    await expect(resetBtn).toBeVisible();
    await expect(stepBtn).toBeVisible();
    await expect(playBtn).toBeVisible();
  });

  test('fill breakdown rows are visible', async ({ page }) => {
    await page.goto('/context/', { waitUntil: 'networkidle' });

    const fillRows = page.locator('.fill-row');
    const count = await fillRows.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('no console errors on context page', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/context/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe('Interactive — Nav on Every Page', () => {

  const pages = ['/', '/models/', '/context/', '/harnesses/', '/tools/', '/orchestration/', '/forge/'];

  for (const path of pages) {
    test(`nav is present on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      const nav = page.locator('.site-nav');
      await expect(nav).toBeVisible();

      const links = page.locator('.site-nav a');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(7); // All nav links
    });

    test(`theme toggle exists on ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle' });
      const btn = page.locator('#theme-btn');
      await expect(btn).toBeVisible();
    });
  }
});
