import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EnquiryForm } from "../components/EnquiryForm";
import { mockFetch, renderWithRouter } from "./utils";

afterEach(() => vi.unstubAllGlobals());

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Asha Builder");
  await user.type(screen.getByLabelText(/^email/i), "asha@example.com");
  await user.type(screen.getByLabelText(/indian mobile number/i), "98450 12345");
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
    expect(screen.getByText("Please check the highlighted fields and try again.")).toBeInTheDocument();
  });

  it("rejects non-Indian and fake mobile numbers before submitting", async () => {
    const fetchMock = mockFetch(() => ({}));
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm />);
    const phone = screen.getByLabelText(/indian mobile number/i);
    await user.type(phone, "+1 555 010 0100");
    await user.tab();
    expect(await screen.findByText(/valid Indian mobile number/i)).toBeInTheDocument();
    await user.clear(phone);
    await user.type(phone, "9999999999");
    await user.tab();
    expect(await screen.findByText(/doesn't look like a real mobile number/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires email verification when no mobile number is given, then submits with the code", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    mockFetch((_method, url, body) => {
      calls.push({ url, body: body as Record<string, unknown> });
      if (url.endsWith("/email-code")) return { json: { data: { expiresInSeconds: 600, resendAfterSeconds: 60, devCode: "482913" } } };
      return { status: 201, json: { data: { id: "e2", emailNotified: false } } };
    });
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm />);
    await user.type(screen.getByLabelText(/full name/i), "Asha Builder");
    await user.type(screen.getByLabelText(/^email/i), "Asha@Example.com");
    await user.selectOptions(screen.getByLabelText(/project type/i), "Commercial construction");
    await user.type(screen.getByLabelText(/project location/i), "Pune");
    await user.type(screen.getByLabelText(/tell us about your project/i), "We need a new office building.");
    await user.click(screen.getByRole("checkbox"));

    // Submitting without a mobile number or code is blocked client-side.
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(await screen.findByText(/verify your email/i, { selector: "p.field-error" })).toBeInTheDocument();
    expect(calls).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /send code/i }));
    expect(await screen.findByText(/code sent to/i)).toBeInTheDocument();
    expect(screen.getByText("482913")).toBeInTheDocument(); // development-mode hint
    expect(screen.getByRole("button", { name: /resend in \d+s/i })).toBeDisabled();
    expect(calls[0]).toMatchObject({ url: "/api/enquiries/email-code", body: { email: "asha@example.com" } });

    await user.type(screen.getByLabelText(/verification code/i), "482913");
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(await screen.findByText(/your enquiry has been received/i)).toBeInTheDocument();
    expect(calls[1]!.body).toMatchObject({ emailCode: "482913" });
    expect(calls[1]!.body.phone).toBeUndefined();
  });

  it("shows the server's limit message when too many enquiries were sent", async () => {
    mockFetch(() => ({
      status: 429,
      json: { error: { code: "ENQUIRY_LIMIT", message: "We've already received the maximum number of enquiries.", details: [{ path: "email", message: "Enquiry limit reached for this email address" }] } },
    }));
    const user = userEvent.setup();
    renderWithRouter(<EnquiryForm />);
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: /send enquiry/i }));
    expect(await screen.findByText("Enquiry limit reached for this email address")).toBeInTheDocument();
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
