import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Plus } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { clearApiCache, useApi } from "../../hooks/useApi";
import { AdminPageHeader, errorText, ImageField, RemoveButton, Toggle, useToast } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/Button";
import { Icon, iconKeys } from "../../components/ui/icons";
import { ErrorState, Spinner } from "../../components/ui/misc";
import type { ServiceDetail } from "../../types/api";

interface FormValues {
  title: string;
  slug: string;
  shortDescription: string;
  intro: string;
  heroImageUrl: string;
  heroImageAlt: string;
  icon: string;
  features: { value: string }[];
  workflow: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  isPublished: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}

const empty: FormValues = {
  title: "",
  slug: "",
  shortDescription: "",
  intro: "",
  heroImageUrl: "",
  heroImageAlt: "",
  icon: "building",
  features: [],
  workflow: [],
  faqs: [],
  isPublished: true,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

const toForm = (s: ServiceDetail): FormValues => ({
  title: s.title,
  slug: s.slug,
  shortDescription: s.shortDescription,
  intro: s.intro,
  heroImageUrl: s.heroImageUrl,
  heroImageAlt: s.heroImageAlt,
  icon: s.icon,
  features: s.features.map((value) => ({ value })),
  workflow: s.workflow,
  faqs: s.faqs,
  isPublished: s.isPublished,
  sortOrder: s.sortOrder,
  seoTitle: s.seoTitle ?? "",
  seoDescription: s.seoDescription ?? "",
});

export default function ServiceEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const existing = useApi<ServiceDetail>(isNew ? null : `/admin/services/${id}`, { cacheable: false });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const { register, control, handleSubmit, reset, formState } = useForm<FormValues>({ defaultValues: empty });
  const features = useFieldArray({ control, name: "features" });
  const workflow = useFieldArray({ control, name: "workflow" });
  const faqs = useFieldArray({ control, name: "faqs" });
  const icon = useWatch({ control, name: "icon" });

  useEffect(() => {
    if (existing.data) reset(toForm(existing.data));
  }, [existing.data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    setServerErrors({});
    const body = {
      ...v,
      slug: v.slug.trim() || undefined,
      sortOrder: Number(v.sortOrder) || 0,
      features: v.features.map((f) => f.value.trim()).filter(Boolean),
      workflow: v.workflow.filter((w) => w.title.trim() && w.description.trim()),
      faqs: v.faqs.filter((f) => f.question.trim() && f.answer.trim()),
    };
    try {
      const res = isNew ? await api.post<ServiceDetail>("/admin/services", body) : await api.put<ServiceDetail>(`/admin/services/${id}`, body);
      clearApiCache("/services");
      toast("success", isNew ? "Service created" : "Service saved");
      if (isNew) navigate(`/admin/services/${res.data.id}`, { replace: true });
      else reset(toForm(res.data));
    } catch (err) {
      if (err instanceof ApiError && err.details) setServerErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      toast("error", errorText(err));
    }
  });

  if (!isNew && existing.loading) return <Spinner />;
  if (!isNew && existing.error) return <ErrorState message={existing.error.message} onRetry={existing.reload} />;
  const err = (k: string) => serverErrors[k] && <p className="field-error">{serverErrors[k]}</p>;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Link to="/admin/services" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All services
      </Link>
      <AdminPageHeader
        title={isNew ? "New service" : "Edit service"}
        actions={
          <Button type="submit" size="sm" className="h-10" loading={formState.isSubmitting}>
            {isNew ? "Create service" : "Save changes"}
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="admin-card space-y-5 p-6">
            <h2 className="font-display font-bold">Content</h2>
            <div>
              <label htmlFor="title" className="field-label">Title</label>
              <input id="title" className="field-input" {...register("title")} />
              {err("title")}
            </div>
            <div>
              <label htmlFor="slug" className="field-label">URL slug <span className="font-normal text-muted">(leave blank to generate)</span></label>
              <input id="slug" className="field-input" {...register("slug")} />
              {err("slug")}
            </div>
            <div>
              <label htmlFor="short" className="field-label">Short description</label>
              <textarea id="short" rows={2} className="field-input" {...register("shortDescription")} />
              {err("shortDescription")}
            </div>
            <div>
              <label htmlFor="intro" className="field-label">Introduction</label>
              <textarea id="intro" rows={6} className="field-input" {...register("intro")} />
              {err("intro")}
            </div>
            <Controller control={control} name="heroImageUrl" render={({ field }) => <ImageField id="hero" label="Hero image" value={field.value} onChange={field.onChange} error={serverErrors.heroImageUrl} />} />
            <div>
              <label htmlFor="heroAlt" className="field-label">Hero image alt text</label>
              <input id="heroAlt" className="field-input" {...register("heroImageAlt")} />
              {err("heroImageAlt")}
            </div>
          </section>

          <section className="admin-card space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">Key features</h2>
              <button type="button" onClick={() => features.append({ value: "" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add
              </button>
            </div>
            {features.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <input aria-label={`Feature ${i + 1}`} className="field-input" {...register(`features.${i}.value`)} />
                <RemoveButton onClick={() => features.remove(i)} label={`Remove feature ${i + 1}`} />
              </div>
            ))}
          </section>

          <section className="admin-card space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">Workflow steps</h2>
              <button type="button" onClick={() => workflow.append({ title: "", description: "" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add
              </button>
            </div>
            {workflow.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2 rounded-xl bg-paper p-3">
                <div className="flex-1 space-y-2">
                  <input aria-label={`Step ${i + 1} title`} placeholder="Step title" className="field-input" {...register(`workflow.${i}.title`)} />
                  <textarea aria-label={`Step ${i + 1} description`} placeholder="Description" rows={2} className="field-input" {...register(`workflow.${i}.description`)} />
                </div>
                <RemoveButton onClick={() => workflow.remove(i)} label={`Remove step ${i + 1}`} />
              </div>
            ))}
          </section>

          <section className="admin-card space-y-3 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">FAQs</h2>
              <button type="button" onClick={() => faqs.append({ question: "", answer: "" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add
              </button>
            </div>
            {faqs.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2 rounded-xl bg-paper p-3">
                <div className="flex-1 space-y-2">
                  <input aria-label={`Question ${i + 1}`} placeholder="Question" className="field-input" {...register(`faqs.${i}.question`)} />
                  <textarea aria-label={`Answer ${i + 1}`} placeholder="Answer" rows={3} className="field-input" {...register(`faqs.${i}.answer`)} />
                </div>
                <RemoveButton onClick={() => faqs.remove(i)} label={`Remove FAQ ${i + 1}`} />
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-card space-y-4 p-6">
            <h2 className="font-display font-bold">Publishing</h2>
            <Controller control={control} name="isPublished" render={({ field }) => <Toggle id="pub" label="Visible on website" checked={field.value} onChange={field.onChange} />} />
            <div>
              <label htmlFor="icon" className="field-label">Icon</label>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue">
                  <Icon name={icon} className="h-5 w-5" />
                </span>
                <select id="icon" className="field-input" {...register("icon")}>
                  {iconKeys.map((k) => <option key={k}>{k}</option>)}
                </select>
              </div>
            </div>
          </section>
          <section className="admin-card space-y-4 p-6">
            <h2 className="font-display font-bold">SEO</h2>
            <div>
              <label htmlFor="seoTitle" className="field-label">SEO title</label>
              <input id="seoTitle" maxLength={70} className="field-input" {...register("seoTitle")} />
            </div>
            <div>
              <label htmlFor="seoDesc" className="field-label">Meta description</label>
              <textarea id="seoDesc" rows={3} maxLength={170} className="field-input" {...register("seoDescription")} />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
