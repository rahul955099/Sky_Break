import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { clearApiCache, useApi } from "../../hooks/useApi";
import { useAuth } from "../../hooks/auth";
import { api } from "../../lib/api";
import { AdminPageHeader, ConfirmDialog, errorText, useToast } from "../../components/admin/AdminUi";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/icons";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/misc";
import type { ServiceSummary } from "../../types/api";

export default function ServicesAdmin() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<ServiceSummary[]>("/admin/services", { cacheable: false });
  const [order, setOrder] = useState<ServiceSummary[] | null>(null);
  const [toDelete, setToDelete] = useState<ServiceSummary | null>(null);
  const list = order ?? data ?? [];

  const move = async (index: number, delta: number) => {
    const next = [...list];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    setOrder(next);
    try {
      const res = await api.put<ServiceSummary[]>("/admin/services/reorder", { ids: next.map((s) => s.id) });
      setOrder(res.data);
      clearApiCache("/services");
    } catch (err) {
      setOrder(null);
      toast("error", errorText(err));
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Services"
        text="Manage service pages. Use the arrows to set display order."
        actions={
          <ButtonLink to="/admin/services/new" size="sm" className="h-10">
            <Plus className="h-4 w-4" aria-hidden="true" /> New service
          </ButtonLink>
        }
      />
      {loading && <Spinner />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && list.length === 0 && <EmptyState title="No services yet" />}
      {list.length > 0 && (
        <ol className="admin-card divide-y divide-line">
          {list.map((s, i) => (
            <li key={s.id} className="flex items-center gap-4 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue">
                <Icon name={s.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <Link to={`/admin/services/${s.id}`} className="font-semibold hover:text-blue">
                  {s.title}
                </Link>
                <p className="truncate text-sm text-muted">
                  /services/{s.slug} {s.isPublished ? "" : "· Hidden"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button disabled={i === 0} onClick={() => move(i, -1)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper disabled:opacity-30" aria-label={`Move ${s.title} up`}>
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button disabled={i === list.length - 1} onClick={() => move(i, 1)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper disabled:opacity-30" aria-label={`Move ${s.title} down`}>
                  <ArrowDown className="h-4 w-4" />
                </button>
                <Link to={`/admin/services/${s.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-paper" aria-label={`Edit ${s.title}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
                {user?.role !== "EDITOR" && (
                  <button onClick={() => setToDelete(s)} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Delete ${s.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.title}”?`}
        text="The service page will be removed. Projects linked to it are kept. Consider hiding it instead."
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          try {
            await api.delete(`/admin/services/${toDelete!.id}`);
            clearApiCache("/services");
            setOrder(null);
            toast("success", "Service deleted");
            reload();
          } catch (err) {
            toast("error", errorText(err));
          }
        }}
      />
    </>
  );
}
