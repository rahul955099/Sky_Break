import { useId, useState, type ReactNode } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { enquirySchema, PROJECT_TYPES, START_OPTIONS, type EnquiryValues } from "../lib/enquirySchema";
import { Button } from "./ui/Button";

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );

const freshAttempt = () => ({ startedAt: Date.now(), key: newKey() });

function Field({
  label,
  error,
  optional,
  children,
  id,
  hint,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  id: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {optional ? <span className="font-normal text-muted">(optional)</span> : <span className="text-blue" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const aria = (id: string, error?: string) => ({
  id,
  "aria-invalid": error ? ("true" as const) : ("false" as const),
  "aria-describedby": error ? `${id}-error` : undefined,
});

interface Props {
  projectSlug?: string;
  defaultProjectType?: (typeof PROJECT_TYPES)[number];
  compact?: boolean;
}

export function EnquiryForm({ projectSlug, defaultProjectType, compact }: Props) {
  const uid = useId();
  const { pathname } = useLocation();
  // Timestamp for bot detection + idempotency key; regenerated after each successful submission.
  const [attempt, setAttempt] = useState(freshAttempt);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverMessage, setServerMessage] = useState<string>("");
  const [emailNotice, setEmailNotice] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EnquiryValues>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { projectType: defaultProjectType, consent: false, website: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setStatus("idle");
    try {
      const res = await api.post<{ id: string; emailNotified: boolean }>("/enquiries", {
        ...values,
        budgetRange: values.budgetRange || undefined,
        expectedStart: values.expectedStart || undefined,
        projectSlug,
        sourcePath: pathname,
        clientSubmissionId: attempt.key,
        formStartedAt: attempt.startedAt,
      });
      setEmailNotice(!res.data.emailNotified);
      setStatus("success");
      reset();
      setAttempt(freshAttempt);
    } catch (err) {
      const e = err instanceof ApiError ? err : new ApiError(0, "UNKNOWN", "Something went wrong. Please try again.");
      e.details?.forEach((d) => {
        if (d.path in enquirySchema.shape) setError(d.path as keyof EnquiryValues, { message: d.message });
      });
      setServerMessage(e.message);
      setStatus("error");
    }
  });

  const id = (name: string) => `${uid}-${name}`;
  const reg = (name: keyof EnquiryValues): UseFormRegisterReturn => register(name);

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        className="rounded-[24px] border border-emerald-200 bg-emerald-50/70 p-8 text-center sm:p-12"
      >
        <CircleCheck className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-5 font-display text-2xl font-bold">Thank you — your enquiry has been received.</h3>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Our team will review your details and get in touch using the contact information you provided.
        </p>
        {emailNotice && (
          <p className="mx-auto mt-3 max-w-md text-xs text-muted">
            Your enquiry was saved securely. (Automatic email confirmation is not enabled on this site.)
          </p>
        )}
        <Button variant="secondary" className="mt-8" onClick={() => setStatus("idle")}>
          Send another enquiry
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={status === "error" ? id("server-error") : undefined} className="space-y-5">
      {/* Honeypot: hidden from people and assistive tech */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={id("website")}>Website</label>
        <input id={id("website")} tabIndex={-1} autoComplete="off" {...reg("website")} />
      </div>

      <div className={`grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
        <Field label="Full name" id={id("fullName")} error={errors.fullName?.message}>
          <input className="field-input" autoComplete="name" {...aria(id("fullName"), errors.fullName?.message)} {...reg("fullName")} />
        </Field>
        <Field label="Email" id={id("email")} error={errors.email?.message}>
          <input type="email" className="field-input" autoComplete="email" inputMode="email" {...aria(id("email"), errors.email?.message)} {...reg("email")} />
        </Field>
        <Field label="Phone" id={id("phone")} error={errors.phone?.message}>
          <input type="tel" className="field-input" autoComplete="tel" inputMode="tel" {...aria(id("phone"), errors.phone?.message)} {...reg("phone")} />
        </Field>
        <Field label="Project type" id={id("projectType")} error={errors.projectType?.message}>
          <select className="field-input" defaultValue={defaultProjectType ?? ""} {...aria(id("projectType"), errors.projectType?.message)} {...reg("projectType")}>
            <option value="" disabled>
              Select a project type
            </option>
            {PROJECT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Project location" id={id("projectLocation")} error={errors.projectLocation?.message} hint="City or area is enough">
          <input className="field-input" autoComplete="address-level2" {...aria(id("projectLocation"), errors.projectLocation?.message)} {...reg("projectLocation")} />
        </Field>
        <Field label="Approximate budget range" optional id={id("budgetRange")} hint="A rough range in your currency helps us plan the conversation">
          <input className="field-input" placeholder="e.g. to be discussed" {...aria(id("budgetRange"))} {...reg("budgetRange")} />
        </Field>
        <Field label="Expected start" optional id={id("expectedStart")}>
          <select className="field-input" defaultValue="" {...aria(id("expectedStart"))} {...reg("expectedStart")}>
            <option value="">Select timing</option>
            {START_OPTIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Tell us about your project" id={id("message")} error={errors.message?.message}>
        <textarea
          rows={5}
          className="field-input resize-y"
          placeholder="What would you like to build or renovate? Share size, timing, or anything else that helps."
          {...aria(id("message"), errors.message?.message)}
          {...reg("message")}
        />
      </Field>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-charcoal/80">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-line accent-blue"
            {...aria(id("consent"), errors.consent?.message)}
            {...reg("consent")}
          />
          <span>
            I agree that Skybreak Infra Pvt Ltd may store and use the details I've provided to respond to my enquiry, as described in the{" "}
            <a href="/privacy-policy" className="font-medium text-blue underline underline-offset-2">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.consent && (
          <p id={`${id("consent")}-error`} className="field-error" role="alert">
            {errors.consent.message}
          </p>
        )}
      </div>

      <AnimatePresence>
        {status === "error" && (
          <motion.div
            id={id("server-error")}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {serverMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <Button type="submit" size="lg" loading={isSubmitting} arrow className="w-full sm:w-auto">
        {isSubmitting ? "Sending…" : "Send enquiry"}
      </Button>
    </form>
  );
}
