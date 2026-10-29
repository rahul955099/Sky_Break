import { expect, test, type Page } from "@playwright/test";
import { E2E_ADMIN } from "./env";

async function fillEnquiry(page: Page, name: string) {
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel(/^Email/).fill("e2e.client@example.test");
  await page.getByLabel("Indian mobile number").fill("98450 12399");
  await page.getByLabel("Project type").selectOption("Renovation / remodeling");
  await page.getByLabel("Project location").fill("Test Town");
  await page.getByLabel("Tell us about your project").fill("We'd like to renovate our kitchen and add a rear extension.");
  await page.getByRole("checkbox").check();
}

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(E2E_ADMIN.email);
  await page.getByLabel("Password", { exact: true }).fill(E2E_ADMIN.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
}

test.describe.serial("enquiry → admin workflow", () => {
  const clientName = `E2E Client ${Date.now()}`;

  test("contact form validates and then submits", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("Please enter your full name")).toBeVisible();
    await expect(page.getByText("Please confirm consent so we can respond")).toBeVisible();

    await fillEnquiry(page, clientName);
    await page.getByLabel(/^Email/).fill("not-an-email");
    await page.getByLabel("Project location").click();
    await expect(page.getByText("Please enter a valid email address")).toBeVisible();
    await page.getByLabel(/^Email/).fill("e2e.client@example.test");

    await page.waitForTimeout(2600); // the API rejects forms submitted faster than a human could
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("your enquiry has been received")).toBeVisible();
    await expect(page.getByText(/email confirmation is not enabled/i)).toBeVisible();
  });

  test("without a mobile number the email must be verified with a code", async ({ page }) => {
    await page.goto("/contact");
    await fillEnquiry(page, `${clientName} (email)`);
    await page.getByLabel("Indian mobile number").fill("");
    await page.getByLabel(/^Email/).fill("verify.me@example.test");
    await expect(page.getByText("Verify your email address")).toBeVisible();

    await page.getByRole("button", { name: "Send code" }).click();
    await expect(page.getByText(/Code sent to/)).toBeVisible();
    // Local development shows the code because email sending is disabled.
    const code = (await page.locator("strong.font-mono").textContent())!.trim();
    expect(code).toMatch(/^\d{6}$/);
    await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();

    await page.getByLabel("Verification code").fill(code === "000000" ? "111111" : "000000");
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.locator("p.field-error", { hasText: /isn't correct/ })).toBeVisible();

    await page.getByLabel("Verification code").fill(code);
    await page.getByRole("button", { name: "Send enquiry" }).click();
    await expect(page.getByText("your enquiry has been received")).toBeVisible();
  });

  test("admin area is protected", async ({ page, request }) => {
    await page.goto("/admin/enquiries");
    await expect(page).toHaveURL(/\/admin\/login/);
    const api = await request.get("/api/admin/enquiries");
    expect(api.status()).toBe(401);
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(E2E_ADMIN.email);
    await page.getByLabel("Password", { exact: true }).fill("wrong-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toContainText("Incorrect email or password");
  });

  test("admin can review an enquiry, change status and add a note", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Enquiries" }).first().click();
    await page.getByLabel("Search enquiries").fill(clientName);
    await page.getByRole("link", { name: clientName }).first().click();
    await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
    await expect(page.getByText("We'd like to renovate our kitchen")).toBeVisible();

    await page.getByLabel("Status").selectOption("CONTACTED");
    await expect(page.getByText("Status set to Contacted")).toBeVisible();
    await page.getByLabel("Add a note").fill("Called the client — site visit to be arranged.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("Called the client — site visit to be arranged.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Status")).toHaveValue("CONTACTED");
    await expect(page.getByText("Called the client — site visit to be arranged.")).toBeVisible();
  });

  test("admin can create, edit and publish a project", async ({ page }) => {
    const title = `E2E Pavilion ${Date.now()}`;
    await signIn(page);
    await page.goto("/admin/projects/new");
    await page.getByLabel("Title", { exact: true }).fill(title);
    await page.getByLabel("Summary").fill("A pavilion created by the end-to-end test suite.");
    await page.getByLabel(/^Description/).fill("This project was created automatically to verify the admin workflow.");
    await page.getByLabel("Cover image", { exact: true }).fill("https://images.unsplash.com/photo-1487958449943-2429e8be8625");
    await page.getByLabel("Cover image alt text").fill("White angular building");
    await page.getByLabel("Category").selectOption("COMMERCIAL");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.getByText("Project created")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Edit project" })).toBeVisible();

    await page.getByLabel("Location", { exact: true }).fill("Edited Location");
    await page.locator('label[for="pub"]').click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Project saved")).toBeVisible();

    const slug = await page.getByLabel(/URL slug/).inputValue();
    await page.goto(`/projects/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("Edited Location").first()).toBeVisible();
  });

  test("admin can update company settings and sign out", async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Settings" }).first().click();
    await page.getByLabel("Contact email").fill("hello@example.test");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText(/settings saved/i)).toBeVisible();

    await page.goto("/contact");
    await expect(page.getByRole("link", { name: "hello@example.test" }).first()).toBeVisible();

    await page.goto("/admin");
    await page.getByRole("button", { name: "Sign out" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
