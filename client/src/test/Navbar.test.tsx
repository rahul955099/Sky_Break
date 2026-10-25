import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Navbar } from "../components/layout/Navbar";
import { renderWithRouter } from "./utils";

describe("Navbar", () => {
  it("renders primary links and a Get a Quote CTA", () => {
    renderWithRouter(<Navbar />);
    const nav = screen.getByRole("navigation", { name: /primary/i });
    for (const label of ["Home", "About", "Services", "Projects", "Our Process", "Contact"]) {
      expect(nav).toHaveTextContent(label);
    }
    expect(screen.getAllByRole("link", { name: /get a quote/i }).length).toBeGreaterThan(0);
  });

  it("opens and closes the mobile menu with the toggle and Escape", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Navbar />);
    const toggle = screen.getByRole("button", { name: /open menu/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: /close menu/i })).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById("mobile-menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: /open menu/i })).toHaveAttribute("aria-expanded", "false");
  });

  it("marks the current page link", () => {
    renderWithRouter(<Navbar />, "/projects");
    const nav = screen.getByRole("navigation", { name: /primary/i });
    expect(nav.querySelector('a[aria-current="page"]')).toHaveTextContent("Projects");
  });
});
