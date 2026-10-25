import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useApi, clearApiCache } from "../../hooks/useApi";
import { useAuth } from "../../hooks/auth";
import { api, qs } from "../../lib/api";
import { AdminPageHeader, ConfirmDialog, errorText, useToast } from "../../components/admin/AdminUi";
import { ButtonLink } from "../../components/ui/Button";
import { EmptyState, ErrorState, SampleBadge, Spinner } from "../../components/ui/misc";
import { categoryLabel, imageSrc, statusLabel } from "../../lib/format";
import type { ProjectSummary } from "../../types/api";

export default function ProjectsAdmin() {
  const { user } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const { data, loading, error, reload } = useApi<ProjectSummary[]>(`/admin/projects${qs({ pageSize: 100, search: search.trim() || undefined })}`, { cacheable: false });
  const [toDelete, setToDelete] = useState<ProjectSummary | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const canDelete = user?.role !== "EDITOR";

  const togglePublish = async (p: ProjectSummary) => {
    const next = !(overrides[p.id] ?? p.isPublished);
    setOverrides((o) => ({ ...o, [p.id]: next }));
    try {
      await api.patch(`/admin/projects/${p.id}/publish`, { isPublished: next });
      clearApiCache("/projects");
      toast("success", next ? "Project published" : "Project unpublished");
    } catch (err) {
      setOverrides((o) => ({ ...o, [p.id]: !next }));
      toast("error", errorText(err));
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Projects"
        text="Create, edit and publish portfolio projects."
        actions={
          <ButtonLink to="/admin/projects/new" size="sm" className="h-10">
            <Plus className="h-4 w-4" aria-hidden="true" /> New project
          </ButtonLink>
        }
      />
      <div className="relative mb-5 max-w-sm">
        <label htmlFor="proj-search" className="sr-only">
          Search projects
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input id="proj-search" type="search" className="field-input py-2.5 pl-10" placeholder="Search projects" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No projects yet" text="Create your first project to show it on the website." />}
      {data && data.length > 0 && (
        <ul className="admin-card divide-y divide-line">
          {data.map((p) => {
            const published = overrides[p.id] ?? p.isPublished;
            return (
              <li key={p.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <img src={imageSrc(p.coverImageUrl, 240)} alt="" className="h-16 w-24 shrink-0 rounded-lg bg-paper object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/admin/projects/${p.id}`} className="font-semibold hover:text-blue">
                      {p.title}
                    </Link>
                    {p.isSample && <SampleBadge />}
                    {p.isFeatured && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[0.7rem] font-semibold text-blue">Featured</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">
                    {categoryLabel[p.category]} · {statusLabel[p.status]} · /{p.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => togglePublish(p)}
                    className={`inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-semibold ring-1 ${published ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-400/30"}`}
                    aria-label={published ? `Unpublish ${p.title}` : `Publish ${p.title}`}
                  >
                    {published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {published ? "Published" : "Draft"}
                  </button>
                  <Link to={`/admin/projects/${p.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper hover:text-navy" aria-label={`Edit ${p.title}`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  {canDelete && (
                    <button onClick={() => setToDelete(p)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${p.title}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.title}”?`}
        text="The project and its gallery will be permanently removed. Enquiries linked to it are kept."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/admin/projects/${toDelete!.id}`);
            clearApiCache("/projects");
            toast("success", "Project deleted");
            reload();
          } catch (err) {
            toast("error", errorText(err));
          }
        }}
      />
    </>
  );
}
