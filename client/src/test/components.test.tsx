import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion } from "../components/ui/misc";
import { ProjectCard } from "../components/ProjectCard";
import { imageSrc, imageSrcSet, telHref } from "../lib/format";
import { renderWithRouter } from "./utils";

describe("Accordion", () => {
  it("toggles panels and reflects state with aria-expanded", async () => {
    const user = userEvent.setup();
    render(
      <Accordion
        items={[
          { question: "Q1?", answer: "A1" },
          { question: "Q2?", answer: "A2" },
        ]}
        defaultOpen={null}
      />,
    );
    const q2 = screen.getByRole("button", { name: "Q2?" });
    expect(q2).toHaveAttribute("aria-expanded", "false");
    await user.click(q2);
    expect(q2).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("A2")).toBeInTheDocument();
  });
});

describe("ProjectCard", () => {
  it("labels illustrative samples and links to the detail page", () => {
    renderWithRouter(
      <ProjectCard
        project={{
          id: "1",
          slug: "sample-villa",
          title: "Sample Villa",
          summary: "A summary",
          category: "RESIDENTIAL",
          status: "CONCEPT",
          location: null,
          coverImageUrl: "https://images.unsplash.com/photo-1?w=10",
          coverImageAlt: "Villa",
          isSample: true,
        }}
      />,
    );
    expect(screen.getByText(/illustrative sample/i)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/projects/sample-villa");
    expect(screen.getByRole("img", { name: "Villa" })).toHaveAttribute("loading", "lazy");
  });
});

describe("format helpers", () => {
  it("builds responsive Unsplash URLs and leaves other URLs alone", () => {
    expect(imageSrc("https://images.unsplash.com/photo-x?w=100", 800)).toContain("w=800");
    expect(imageSrc("/uploads/a.png", 800)).toBe("/uploads/a.png");
    expect(imageSrcSet("https://images.unsplash.com/photo-x")).toContain("1600w");
    expect(imageSrcSet("/uploads/a.png")).toBeUndefined();
  });

  it("normalises phone links", () => {
    expect(telHref("+1 (555) 010-0")).toBe("tel:+15550100");
  });
});
