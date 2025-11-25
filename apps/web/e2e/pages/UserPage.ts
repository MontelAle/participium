import { type Page, type Locator, expect } from '@playwright/test';

export class MunicipalityUsersPage {
  readonly page: Page;

  readonly searchInput: Locator;
  readonly roleFilterTrigger: Locator;
  readonly officeFilterTrigger: Locator;
  readonly clearFiltersButton: Locator;
  readonly addUserButton: Locator;

  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.getByPlaceholder('Search users...');
    this.roleFilterTrigger = page
      .getByRole('combobox')
      .filter({ hasText: /role/i });
    this.officeFilterTrigger = page
      .getByRole('combobox')
      .filter({ hasText: /office/i });
    this.clearFiltersButton = page.getByRole('button', {
      name: /Clear|Reset/i,
    });
    this.addUserButton = page.getByRole('button', { name: /Add User/i });

    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.usernameInput = page.locator('input[name="username"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');

    this.submitButton = page.locator('button[type="submit"]');
    this.confirmDeleteButton = page.getByRole('button', {
      name: 'Delete User',
    });
  }

  async goto() {
    await this.page.goto('/app/municipality-users');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByRole(roleName: string) {
    await this.roleFilterTrigger.click();
    await this.page.getByRole('option', { name: roleName }).click();
    await this.page.keyboard.press('Escape');
  }

  async openCreateDialog() {
    await this.addUserButton.click();
  }

  async fillUserForm(user: any) {
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.usernameInput.fill(user.username);
    await this.emailInput.fill(user.email);

    if (user.roleLabel) {
      await this.page.locator('button:has-text("Select Role")').click();
      await this.page.getByRole('option', { name: user.roleLabel }).click();
    }

    if (user.officeLabel) {
      await this.page.locator('button:has-text("Select Office")').click();
      await this.page.getByRole('option', { name: user.officeLabel }).click();
    }

    if (user.password) {
      await this.passwordInput.fill(user.password);
    }
  }

  async submit() {
    await this.submitButton.click();
  }

  getRowByUsername(username: string) {
    return this.page.locator('tr', { hasText: username });
  }

  async clickEdit(username: string) {
    const row = this.getRowByUsername(username);
    await row.locator('button:has(.lucide-pencil)').click();
  }

  async clickDelete(username: string) {
    const row = this.getRowByUsername(username);
    await row.locator('button:has(.lucide-trash-2)').click();
  }
}
