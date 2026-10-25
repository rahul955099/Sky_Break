import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnquiryForm } from "../components/EnquiryForm";
import { mockFetch, renderWithRouter } from "./utils";

afterEach(() => vi.unstubAllGlobals());

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Asha Builder");
  await user.type(screen.getByLabelText(/^email/i), "asha@example.com");
  await user.type(screen.getByLabelText(/^phone/i), "+1 555 0100");
  await user.selectOptions(screen.getByLabelText(/project type/i), "Commercial construction");
  await user.type(screen.getByLabelText(/project location/i), "Sample City");
  await user.type(screen.getByLabelText(/tell us about your project/i), "We need a new office building.");
  await user.click(screen.getByRole("checkbox"));
}

describe("EnquiryForm", () => {
  it("shows accessible validation errors and does not submit when empty", async () => {
    const fetchMock = mockFetch(() => ({}));
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm />);
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(await screen.findByText(/please enter your full name/i)).toBeInTheDocument();
    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm consent/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a valid enquiry with an idempotency key and shows success", async () => {
    const fetchMock = mockFetch(() => ({ status: 201, json: { data: { id: "e1", emailNotified: false, duplicate: false } } }));
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm projectSlug="sample-project" />, "/projects/sample-project");
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));

    expect(await screen.findByText(/your enquiry has been received/i)).toBeInTheDocument();
    expect(screen.getByText(/automatic email confirmation is not enabled/i)).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("/api/enquiries");
    const body = JSON.parse(String(init!.body));
    expect(body).toMatchObject({
      fullName: "Asha Builder",
      projectType: "Commercial construction",
      consent: true,
      projectSlug: "sample-project",
      sourcePath: "/projects/sample-project",
      website: "",
    });
    expect(body.clientSubmissionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(typeof body.formStartedAt).toBe("number");
  });

  it("maps server-side field errors and shows the server message", async () => {
    mockFetch(() => ({
      status: 422,
      json: {
        error: { code: "VALIDATION_ERROR", message: "Some fields are invalid.", details: [{ path: "phone", message: "Phone rejected by server" }] },
      },
    }));
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(await screen.findByText("Phone rejected by server")).toBeInTheDocument();
    expect(screen.getByText("Some fields are invalid.")).toBeInTheDocument();
  });

  it("reports network failures helpfully", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));
    await waitFor(() => expect(screen.getByText(/reach the server/i)).toBeInTheDocument());
  });
});
