import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/about", "/services", "/services/residential-construction", "/projects", "/projects/courtyard-villa-sample", "/process", "/contact", "/faq", "/privacy-policy", "/terms-of-use"];
const WIDTHS = [375, 768, 1024, 1440];

/** Scrolls through the page so lazy images and in-view animations trigger. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
}

test.describe("public site", () => {
  test("home page renders the hero, every section and sample labelling", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Skybreak Infra Pvt Ltd/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Building\s+the\s+future/i);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Engineering\s*excellence/i);
    await expect(page.getByRole("link", { name: "Explore Our Projects" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Discuss Your Project" }).first()).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /localhost:5180/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Skybreak Infra Pvt Ltd/);
    // Real-time 3D canvas (or the static fallback when WebGL is unavailable) in the hero
    await expect(page.locator('section[aria-labelledby="hero-heading"]').locator("canvas, img").first()).toBeAttached({ timeout: 20_000 });

    for (const heading of [
      /spaces built with care/i,
      /construction solutions for every kind of space/i,
      /portfolio shaped by purpose/i,
      /what you can expect from us/i,
      /six steps from first idea to handover/i,
      /let's talk about your project/i,
    ]) {
      const h = page.getByRole("heading", { name: heading });
      await h.scrollIntoViewIfNeeded();
      await expect(h).toBeVisible();
    }
    await expect(page.getByText("Illustrative sample").first()).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeVisible();
  });

  test("project filters, search, detail page and lightbox", async ({ page }) => {
    await page.goto("/projects");
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();
    expect(total).toBeGreaterThan(3);

    await page.getByRole("button", { name: "Commercial" }).click();
    await expect(page).toHaveURL(/category=COMMERCIAL/);
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeLessThan(total);

    await page.getByRole("button", { name: "All projects" }).click();
    await page.getByLabel("Search projects").fill("villa");
    await expect(page).toHaveURL(/search=villa/);
    await expect(cards).toHaveCount(1);
    await cards.first().getByRole("link").click();

    await expect(page).toHaveURL(/\/projects\/courtyard-villa-sample/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Courtyard Villa");
    await expect(page.getByText(/does not represent completed Skybreak Infra Pvt Ltd work/i).first()).toBeVisible();

    await page.getByRole("button", { name: /open image gallery/i }).click();
    const dialog = page.getByRole("dialog", { name: "Image gallery" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("1 /");
    await page.keyboard.press("ArrowRight");
    await expect(dialog).toContainText("2 /");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("unknown routes show the 404 page", async ({ page }) => {
    await page.goto("/this-does-not-exist");
    await expect(page.getByRole("heading", { name: /isn't on the plans/i })).toBeVisible();
    await page.goto("/projects/not-a-real-project");
    await expect(page.getByRole("heading", { name: /isn't on the plans/i })).toBeVisible();
  });

  test("all internal links resolve to real pages", async ({ page }) => {
    test.setTimeout(180_000);
    const seen = new Set<string>();
    for (const start of ["/", "/services", "/projects"]) {
      await page.goto(start);
      await scrollThrough(page);
      const hrefs = await page.$$eval("a[href^='/']", (as) => as.map((a) => a.getAttribute("href")!));
      hrefs.filter((h) => !h.startsWith("/api") && !h.startsWith("/admin")).forEach((h) => seen.add(h.split("#")[0]!));
    }
    expect(seen.size).toBeGreaterThan(15);
    for (const href of seen) {
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1 }), `heading on ${href}`).toBeVisible();
      await expect(page.getByRole("heading", { name: /isn't on the plans/i }), `404 on ${href}`).toHaveCount(0);
    }
  });

  test("sitemap and robots are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("/projects/courtyard-villa-sample");
    const robots = await request.get("/robots.txt");
    expect(await robots.text()).toContain("Disallow: /admin");
  });
});

test.describe("immersive 3D (full motion)", () => {
  test.use({ reducedMotion: "no-preference" });

  test("hero scene mounts, and off-screen scenes are released as you scroll", async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.locator('section[aria-labelledby="hero-heading"] canvas')).toBeAttached({ timeout: 30_000 });
    for (const id of ["services-heading", "capabilities-heading", "contact-heading"]) {
      await page.evaluate((i) => document.getElementById(i)!.scrollIntoView(), id);
      await page.waitForTimeout(1500);
      // Never more than two live WebGL contexts at once (normally one).
      expect(await page.locator("canvas").count()).toBeLessThanOrEqual(2);
    }
    await expect(page.locator("canvas")).toHaveCount(0); // contact + footer: no scene nearby
  });
});

test.describe("responsive layout", () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow or broken images at ${width}px`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await scrollThrough(page);
        await page.waitForLoadState("networkidle");
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `horizontal overflow on ${path} at ${width}px`).toBeLessThanOrEqual(0);
        const broken = await page.$$eval("img", (imgs) =>
          imgs.filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src")).map((i) => i.getAttribute("src")),
        );
        expect(broken, `broken images on ${path}`).toEqual([]);
        await expect(page.getByText("Image unavailable")).toHaveCount(0);
      }
    });
  }

  test("mobile navigation opens, navigates and closes", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toBeVisible();
    await toggle.click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: /Our Process/ }).click();
    await expect(page).toHaveURL(/\/process$/);
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("clear path");
  });
});
