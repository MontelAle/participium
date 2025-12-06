import { type Locator, type Page } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly emailInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.emailInput = page.locator('input[name="email"]');
    this.firstNameInput = page.locator('input[name="firstname"]');
    this.lastNameInput = page.locator('input[name="lastname"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async gotoLogin() {
    await this.page.goto('/auth/login');
  }

  async gotoRegister() {
    await this.page.goto('/auth/register');
  }

  async login(username: string, pass: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async register(user: {
    username: string;
    email: string;
    first: string;
    last: string;
    pass: string;
  }) {
    await this.usernameInput.fill(user.username);
    await this.emailInput.fill(user.email);
    await this.firstNameInput.fill(user.first);
    await this.lastNameInput.fill(user.last);
    await this.passwordInput.fill(user.pass);
    await this.submitButton.click();
  }
}
