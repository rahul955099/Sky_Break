import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

let transporter: Transporter | null = null;

export const emailEnabled = () => env.EMAIL_PROVIDER === "smtp" && Boolean(env.SMTP_HOST);

function getTransporter() {
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Sends a one-time verification code. Returns false (never throws) on delivery failure. */
export async function sendVerificationCodeEmail(to: string, code: string, companyName: string): Promise<boolean> {
  if (!emailEnabled()) return false;
  try {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: `${code} is your ${companyName} verification code`,
      text: `Your ${companyName} verification code is ${code}.

It expires in 10 minutes. If you didn't request it, you can ignore this email.`,
      html: `<p>Your ${escapeHtml(companyName)} verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. If you didn't request it, you can ignore this email.</p>`,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send verification code:", (err as Error).message);
    return false;
  }
}

export interface EnquiryEmail {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  emailVerified?: boolean;
  projectType: string;
  projectLocation: string;
  budgetRange: string | null;
  expectedStart: string | null;
  message: string;
}

/** Sends an internal notification. Returns false (never throws) so enquiry saving is unaffected. */
export async function sendEnquiryNotification(enquiry: EnquiryEmail): Promise<boolean> {
  if (!emailEnabled()) return false;
  const rows: [string, string | null][] = [
    ["Name", enquiry.fullName],
    ["Email", enquiry.email],
    ["Mobile", enquiry.phone ?? "Not provided"],
    ["Email verified", enquiry.emailVerified ? "Yes" : "No"],
    ["Project type", enquiry.projectType],
    ["Location", enquiry.projectLocation],
    ["Budget range", enquiry.budgetRange],
    ["Expected start", enquiry.expectedStart],
  ];
  try {
    await getTransporter().sendMail({
      from: env.EMAIL_FROM,
      to: env.ENQUIRY_NOTIFY_TO,
      replyTo: enquiry.email,
      subject: `New enquiry: ${enquiry.projectType} — ${enquiry.fullName}`,
      text: [...rows.map(([k, v]) => `${k}: ${v ?? "—"}`), "", enquiry.message, "", `Ref: ${enquiry.id}`].join("\n"),
      html: `<h2>New project enquiry</h2><table>${rows
        .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${escapeHtml(v ?? "—")}</td></tr>`)
        .join("")}</table><p>${escapeHtml(enquiry.message).replace(/\n/g, "<br>")}</p><p>Ref: ${enquiry.id}</p>`,
    });
    return true;
  } catch (err) {
    console.error("[email] Failed to send enquiry notification:", (err as Error).message);
    return false;
  }
}
