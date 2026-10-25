import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { ArrowDown, ArrowLeft, ArrowUp, Plus } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { clearApiCache, useApi } from "../../hooks/useApi";
import { AdminPageHeader, errorText, ImageField, RemoveButton, Toggle, useToast } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/misc";
import { categoryLabel, statusLabel } from "../../lib/format";
import type { ProjectCategory, ProjectDetail, ProjectStatus, ServiceSummary } from "../../types/api";

interface FormValues {
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  location: string;
  coverImageUrl: string;
  coverImageAlt: string;
  specifications: { label: string; value: string }[];
  images: { url: string; alt: string }[];
  serviceIds: string[];
  isSample: boolean;
  isPublished: boolean;
  isFeatured: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}

const empty: FormValues = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  category: "RESIDENTIAL",
  status: "PLANNED",
  location: "",
  coverImageUrl: "",
  coverImageAlt: "",
  specifications: [],
  images: [],
  serviceIds: [],
  isSample: false,
  isPublished: false,
  isFeatured: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

function toForm(p: ProjectDetail): FormValues {
  return {
    ...empty,
    title: p.title,
    slug: p.slug,
    summary: p.summary,
    description: p.description,
    category: p.category,
    status: p.status,
    location: p.location ?? "",
    coverImageUrl: p.coverImageUrl,
    coverImageAlt: p.coverImageAlt,
    specifications: p.specifications ?? [],
    images: p.images.map(({ url, alt }) => ({ url, alt })),
    serviceIds: p.services.map((s) => s.id),
    isSample: p.isSample,
    isPublished: Boolean(p.isPublished),
    isFeatured: Boolean(p.isFeatured),
    sortOrder: p.sortOrder ?? 0,
    seoTitle: p.seoTitle ?? "",
    seoDescription: p.seoDescription ?? "",
  };
}

export default function ProjectEditor() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const toast = useToast();
  const existing = useApi<ProjectDetail>(isNew ? null : `/admin/projects/${id}`, { cacheable: false });
  const services = useApi<ServiceSummary[]>("/admin/services", { cacheable: false });
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const { register, control, handleSubmit, reset, formState } = useForm<FormValues>({ defaultValues: empty });
  const specs = useFieldArray({ control, name: "specifications" });
  const gallery = useFieldArray({ control, name: "images" });

  useEffect(() => {
    if (existing.data) reset(toForm(existing.data));
  }, [existing.data, reset]);

  const onSubmit = handleSubmit(async (v) => {
    setServerErrors({});
    const body = {
      ...v,
      slug: v.slug.trim() || undefined,
      sortOrder: Number(v.sortOrder) || 0,
      specifications: v.specifications.filter((s) => s.label.trim() && s.value.trim()),
      images: v.images.filter((i) => i.url.trim()),
    };
    try {
      const res = isNew ? await api.post<ProjectDetail>("/admin/projects", body) : await api.put<ProjectDetail>(`/admin/projects/${id}`, body);
      clearApiCache("/projects");
      toast("success", isNew ? "Project created" : "Project saved");
      if (isNew) navigate(`/admin/projects/${res.data.id}`, { replace: true });
      else reset(toForm(res.data));
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setServerErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      }
      toast("error", errorText(err));
    }
  });

  if (!isNew && existing.loading) return <Spinner />;
  if (!isNew && existing.error) return <ErrorState message={existing.error.message} onRetry={existing.reload} />;

  const err = (k: string) => serverErrors[k] && <p className="field-error">{serverErrors[k]}</p>;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Link to="/admin/projects" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All projects
      </Link>
      <AdminPageHeader
        title={isNew ? "New project" : "Edit project"}
        actions={
          <>
            {!isNew && existing.data?.isPublished && (
              <a href={`/projects/${existing.data.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-line hover:bg-white">
                View live
              </a>
            )}
            <Button type="submit" size="sm" className="h-10" loading={formState.isSubmitting}>
              {isNew ? "Create project" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="admin-card space-y-5 p-6">
            <h2 className="font-display font-bold">Content</h2>
            <div>
              <label htmlFor="title" className="field-label">Title</label>
              <input id="title" className="field-input" {...register("title", { required: true })} />
              {err("title")}
            </div>
            <div>
              <label htmlFor="slug" className="field-label">URL slug <span className="font-normal text-muted">(leave blank to generate)</span></label>
              <input id="slug" className="field-input" placeholder="e.g. riverside-villa" {...register("slug")} />
              {err("slug")}
            </div>
            <div>
              <label htmlFor="summary" className="field-label">Summary</label>
              <textarea id="summary" rows={2} className="field-input" {...register("summary")} />
              {err("summary")}
            </div>
            <div>
              <label htmlFor="description" className="field-label">Description <span className="font-normal text-muted">(blank lines create paragraphs)</span></label>
              <textarea id="description" rows={8} className="field-input" {...register("description")} />
              {err("description")}
            </div>
          </section>

          <section className="admin-card space-y-5 p-6">
            <h2 className="font-display font-bold">Images</h2>
            <Controller control={control} name="coverImageUrl" render={({ field }) => <ImageField id="cover" label="Cover image" value={field.value} onChange={field.onChange} error={serverErrors.coverImageUrl} />} />
            <div>
              <label htmlFor="coverAlt" className="field-label">Cover image alt text</label>
              <input id="coverAlt" className="field-input" placeholder="Describe the image for screen readers" {...register("coverImageAlt")} />
              {err("coverImageAlt")}
            </div>
            <div className="border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Gallery ({gallery.fields.length})</h3>
                <button type="button" onClick={() => gallery.append({ url: "", alt: "" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add image
                </button>
              </div>
              <ol className="mt-4 space-y-4">
                {gallery.fields.map((f, i) => (
                  <li key={f.id} className="rounded-xl bg-paper p-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1 space-y-3">
                        <Controller control={control} name={`images.${i}.url`} render={({ field }) => <ImageField id={`img-${i}`} label={`Image ${i + 1}`} value={field.value} onChange={field.onChange} error={serverErrors[`images.${i}.url`]} />} />
                        <input aria-label={`Image ${i + 1} alt text`} className="field-input" placeholder="Alt text" {...register(`images.${i}.alt`)} />
                        {err(`images.${i}.alt`)}
                      </div>
                      <div className="flex flex-col gap-1 pt-7">
                        <button type="button" disabled={i === 0} onClick={() => gallery.move(i, i - 1)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30" aria-label="Move up">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={i === gallery.fields.length - 1} onClick={() => gallery.move(i, i + 1)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-white disabled:opacity-30" aria-label="Move down">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <RemoveButton onClick={() => gallery.remove(i)} label={`Remove image ${i + 1}`} />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="admin-card space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold">Key specifications</h2>
              <button type="button" onClick={() => specs.append({ label: "", value: "" })} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue">
                <Plus className="h-4 w-4" aria-hidden="true" /> Add
              </button>
            </div>
            {specs.fields.length === 0 && <p className="text-sm text-muted">Only add specifications you can verify.</p>}
            {specs.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <input aria-label="Specification label" className="field-input" placeholder="Label" {...register(`specifications.${i}.label`)} />
                <input aria-label="Specification value" className="field-input" placeholder="Value" {...register(`specifications.${i}.value`)} />
                <RemoveButton onClick={() => specs.remove(i)} label="Remove specification" />
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="admin-card space-y-4 p-6">
            <h2 className="font-display font-bold">Publishing</h2>
            <Controller control={control} name="isPublished" render={({ field }) => <Toggle id="pub" label="Published" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="isFeatured" render={({ field }) => <Toggle id="feat" label="Featured on home page" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="isSample" render={({ field }) => <Toggle id="sample" label="Illustrative sample (not real work)" checked={field.value} onChange={field.onChange} />} />
            <div>
              <label htmlFor="sort" className="field-label">Sort order</label>
              <input id="sort" type="number" min={0} className="field-input" {...register("sortOrder", { valueAsNumber: true })} />
            </div>
          </section>
          <section className="admin-card space-y-4 p-6">
            <h2 className="font-display font-bold">Classification</h2>
            <div>
              <label htmlFor="category" className="field-label">Category</label>
              <select id="category" className="field-input" {...register("category")}>
                {(Object.keys(categoryLabel) as ProjectCategory[]).map((c) => <option key={c} value={c}>{categoryLabel[c]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="field-label">Status</label>
              <select id="status" className="field-input" {...register("status")}>
                {(Object.keys(statusLabel) as ProjectStatus[]).map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="location" className="field-label">Location</label>
              <input id="location" className="field-input" {...register("location")} />
            </div>
            <fieldset>
              <legend className="field-label">Related services</legend>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {services.data?.map((s) => (
                  <label key={s.id} className="flex items-center gap-2.5 text-sm">
                    <input type="checkbox" value={s.id} className="h-4 w-4 accent-blue" {...register("serviceIds")} />
                    {s.title}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
          <section className="admin-card space-y-4 p-6">
            <h2 className="font-display font-bold">SEO</h2>
            <div>
              <label htmlFor="seoTitle" className="field-label">SEO title <span className="font-normal text-muted">(≤ 70)</span></label>
              <input id="seoTitle" maxLength={70} className="field-input" {...register("seoTitle")} />
            </div>
            <div>
              <label htmlFor="seoDesc" className="field-label">Meta description <span className="font-normal text-muted">(≤ 170)</span></label>
              <textarea id="seoDesc" rows={3} maxLength={170} className="field-input" {...register("seoDescription")} />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}
