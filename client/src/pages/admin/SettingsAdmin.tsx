import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { api, ApiError } from "../../lib/api";
import { clearApiCache, useApi } from "../../hooks/useApi";
import { AdminPageHeader, errorText, ImageField, useToast } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/misc";
import type { CompanySettings, SocialLinks } from "../../types/api";

type FormValues = Omit<CompanySettings, "socialLinks"> & { socialLinks: Required<{ [K in keyof SocialLinks]: string }> };

const SOCIAL: (keyof SocialLinks)[] = ["linkedin", "instagram", "facebook", "youtube", "x"];

const toForm = (s: CompanySettings): FormValues => ({
  ...s,
  contactEmail: s.contactEmail ?? "",
  phone: s.phone ?? "",
  whatsapp: s.whatsapp ?? "",
  address: s.address ?? "",
  officeHours: s.officeHours ?? "",
  logoUrl: s.logoUrl ?? "",
  seoTitle: s.seoTitle ?? "",
  seoDescription: s.seoDescription ?? "",
  ogImageUrl: s.ogImageUrl ?? "",
  socialLinks: Object.fromEntries(SOCIAL.map((k) => [k, s.socialLinks?.[k] ?? ""])) as FormValues["socialLinks"],
});

export default function SettingsAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<CompanySettings>("/admin/settings", { cacheable: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, control, handleSubmit, reset, formState } = useForm<FormValues>();

  useEffect(() => {
    if (data) reset(toForm(data));
  }, [data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    setErrors({});
    try {
      const res = await api.put<CompanySettings>("/admin/settings", v);
      reset(toForm(res.data));
      clearApiCache("/settings");
      toast("success", "Settings saved. Reload the public site to see changes.");
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      toast("error", errorText(err));
    }
  });

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error?.message ?? "Couldn't load settings"} onRetry={reload} />;

  const field = (name: keyof FormValues | `socialLinks.${keyof SocialLinks}`, label: string, opts: { type?: string; textarea?: boolean; hint?: string } = {}) => (
    <div key={name}>
      <label htmlFor={name} className="field-label">
        {label}
      </label>
      {opts.textarea ? <textarea id={name} rows={3} className="field-input" {...register(name)} /> : <input id={name} type={opts.type ?? "text"} className="field-input" {...register(name)} />}
      {opts.hint && !errors[name] && <p className="mt-1.5 text-xs text-muted">{opts.hint}</p>}
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <AdminPageHeader
        title="Company settings"
        text="These details appear in the header, footer, contact page and structured data. Leave a field empty to hide it."
        actions={
          <Button type="submit" size="sm" className="h-10" loading={formState.isSubmitting}>
            Save settings
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="admin-card space-y-5 p-6">
          <h2 className="font-display font-bold">Brand</h2>
          {field("companyName", "Company name")}
          {field("tagline", "Tagline")}
          <Controller control={control} name="logoUrl" render={({ field: f }) => <ImageField id="logo" label="Logo (optional — replaces the default mark)" value={f.value ?? ""} onChange={f.onChange} error={errors.logoUrl} />} />
        </section>
        <section className="admin-card space-y-5 p-6">
          <h2 className="font-display font-bold">Contact</h2>
          {field("contactEmail", "Contact email", { type: "email" })}
          {field("phone", "Phone", { type: "tel", hint: "Include the country code, e.g. +00 …" })}
          {field("whatsapp", "WhatsApp number", { type: "tel" })}
          {field("address", "Office address", { textarea: true })}
          {field("officeHours", "Office hours")}
        </section>
        <section className="admin-card space-y-5 p-6">
          <h2 className="font-display font-bold">Social media</h2>
          {SOCIAL.map((k) => field(`socialLinks.${k}`, k === "x" ? "X (Twitter)" : k[0]!.toUpperCase() + k.slice(1), { type: "url" }))}
        </section>
        <section className="admin-card space-y-5 p-6">
          <h2 className="font-display font-bold">SEO defaults</h2>
          {field("seoTitle", "Default page title")}
          {field("seoDescription", "Default meta description", { textarea: true })}
          <Controller control={control} name="ogImageUrl" render={({ field: f }) => <ImageField id="og" label="Default social share image" value={f.value ?? ""} onChange={f.onChange} error={errors.ogImageUrl} />} />
        </section>
      </div>
    </form>
  );
}
