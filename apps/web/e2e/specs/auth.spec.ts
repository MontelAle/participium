import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage.js';
import {
  createLoginResponse,
  createRegisterResponse,
} from '../fixtures/auth-municipal-data.js';

test.describe('Auth Flow', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('Login Admin: redirect a Dashboard', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill(createLoginResponse('admin'));
      } else {
        await route.continue();
      }
    });

    await authPage.gotoLogin();
    await authPage.login('admin', 'passwordSegreta');

    await expect(page.getByText('Login successful!')).toBeVisible();
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('Login Citizen: redirect a Report Map', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill(createLoginResponse('user'));
      } else {
        await route.continue();
      }
    });

    await authPage.gotoLogin();
    await authPage.login('mario_rossi', 'userPassword');

    await expect(page).toHaveURL(/\/report-map/);
  });

  test('Login PR Officer: redirect a Dashboard', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill(createLoginResponse('pr_officer'));
      } else {
        await route.continue();
      }
    });

    await authPage.gotoLogin();
    await authPage.login('pr_officer_1', 'password');

    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('Register as new citizen', async ({ page }) => {
    await page.route('**/auth/register', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill(createRegisterResponse());
      } else {
        await route.continue();
      }
    });

    await authPage.gotoRegister();
    await authPage.register({
      username: 'nuovo_cittadino',
      email: 'new@citizen.com',
      first: 'Mario',
      last: 'Rossi',
      pass: 'securePass123',
    });

    await expect(page.getByText('Registration successful!')).toBeVisible();
    await expect(page).toHaveURL(/\/report-map/);
  });

  test('Manage Login: Invalid Credentials', async ({ page }) => {
    await page.route('**/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      } else {
        await route.continue();
      }
    });

    await authPage.gotoLogin();
    await authPage.login('hacker', 'wrongPass');

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
