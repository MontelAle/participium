import { test, expect } from '@playwright/test';
import { MunicipalityUsersPage } from '../pages/UserPage.js';
import { AuthPage } from '../pages/AuthPage.js';
import {
  createLoginResponse,
  createMutationResponse,
  mockMunicipalityUsers,
  mockOffices,
  mockRoles,
} from '../fixtures/auth-municipal-data.js';

const successResponse = (data: any) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ success: true, data }),
});

test.describe('Municipality Users Management (System Admin)', () => {
  let usersPage: MunicipalityUsersPage;

  test.beforeEach(async ({ page }) => {
    usersPage = new MunicipalityUsersPage(page);
    const authPage = new AuthPage(page);

    await page.route('**/auth/login', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill(createLoginResponse('admin'));
      } else {
        await route.continue();
      }
    });

    await page.route('**/users/municipality', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: mockMunicipalityUsers }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route('**/roles/', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockRoles }),
      }),
    );

    await page.route('**/offices', async (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: mockOffices }),
      }),
    );

    await authPage.gotoLogin();
    await authPage.login('admin', 'admin');
    await expect(page).toHaveURL(/\/app\/dashboard/);
    await usersPage.goto();
  });

  test('Client-Side Filters: Search by name and filter by role', async ({
    page,
  }) => {
    await expect(page.locator('tbody tr')).toHaveCount(3);

    await usersPage.search('Giovanni');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(
      usersPage.getRowByUsername('tech_infrastructure_1'),
    ).toBeVisible();

    await usersPage.search('');
    await expect(page.locator('tbody tr')).toHaveCount(3);

    await usersPage.filterByRole('PR Officer');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(
      usersPage.getRowByUsername('tech_infrastructure_1'),
    ).toBeHidden();
  });

  test('Create New Municipality User', async ({ page }) => {
    const createPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/users/municipality') && req.method() === 'POST',
    );

    await page.route('**/users/municipality', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill(createMutationResponse({ id: 'new-user' }));
      } else {
        await route.fulfill(successResponse(mockMunicipalityUsers));
      }
    });

    await usersPage.openCreateDialog();

    await usersPage.fillUserForm({
      firstName: 'Marco',
      lastName: 'Rossi',
      username: 'tech_maintenance_new',
      email: 'tech.new@participium.com',
      password: 'password123',
      roleLabel: 'Tech Officer',
      officeLabel: 'Maintenance and Technical Services',
    });

    await usersPage.submit();

    const request = await createPromise;
    const postData = request.postDataJSON();

    expect(postData).toMatchObject({
      username: 'tech_maintenance_new',
      email: 'tech.new@participium.com',
      roleId: 'role-tech_officer',
      officeId: 'maintenance',
    });

    await expect(
      page.getByText('Municipality user created successfully'),
    ).toBeVisible();
  });

  test('Update existing municipality user', async ({ page }) => {
    const userToEdit = mockMunicipalityUsers[0]!;

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes(`/users/municipality/user/${userToEdit.id}`) &&
        req.method() === 'POST',
    );

    await page.route(
      `**/users/municipality/user/${userToEdit.id}`,
      async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill(createMutationResponse({ id: userToEdit.id }));
        }
      },
    );

    await usersPage.clickEdit(userToEdit.username);
    await expect(usersPage.usernameInput).toHaveValue(userToEdit.username);

    await usersPage.firstNameInput.fill('Mario Updated');
    await usersPage.lastNameInput.fill('Rossi Updated');
    await usersPage.usernameInput.fill('mario.rossi.updated');
    await usersPage.emailInput.fill('mario@updated.com');

    await usersPage.submit();

    const request = await updatePromise;
    const postData = request.postDataJSON();

    expect(postData).toMatchObject({
      firstName: 'Mario Updated',
      lastName: 'Rossi Updated',
      username: 'mario.rossi.updated',
      email: 'mario@updated.com',
    });

    await expect(page.getByText('User updated successfully')).toBeVisible();
  });

  test('Delete existing municipality user', async ({ page }) => {
    const userToDelete = mockMunicipalityUsers[1]!;

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes(`/users/municipality/user/${userToDelete.id}`) &&
        req.method() === 'DELETE',
    );

    await page.route(
      `**/users/municipality/user/${userToDelete.id}`,
      async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill(createMutationResponse({ id: userToDelete.id }));
        }
      },
    );

    await usersPage.clickDelete(userToDelete.username);
    await usersPage.confirmDeleteButton.click();

    await deletePromise;
    await expect(
      page.getByText(`User "${userToDelete.username}" deleted successfully`),
    ).toBeVisible();
  });
});
