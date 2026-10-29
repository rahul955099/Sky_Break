import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { apiUrl, qs } from "../../lib/api";
import { AdminPageHeader } from "../../components/admin/AdminUi";
import { EmptyState, ErrorState, Spinner } from "../../components/ui/misc";
import { enquiryStatusLabel, enquiryStatusTone, formatDate } from "../../lib/format";
import type { EnquiryStatus, EnquirySummary } from "../../types/api";

const STATUSES: ("" | EnquiryStatus)[] = ["", "NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"];

export default function Enquiries() {
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") ?? "") as "" | EnquiryStatus;
  const search = params.get("search") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [term, setTerm] = useState(search);

  useEffect(() => {
    const t = setTimeout(() => {
      if (term.trim() === search) return;
      const next = new URLSearchParams(params);
      if (term.trim()) next.set("search", term.trim());
      else next.delete("search");
      next.delete("page");
      setParams(next, { replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [term, search, params, setParams]);

  const { data, meta, loading, error, reload } = useApi<EnquirySummary[]>(
    `/admin/enquiries${qs({ status: status || undefined, search: search || undefined, page })}`,
    { cacheable: false },
  );

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== "page") next.delete("page");
    setParams(next);
  };

  return (
    <>
      <AdminPageHeader
        title="Enquiries"
        text="Project enquiries submitted through the website."
        actions={
          <a
            href={apiUrl(`/admin/enquiries/export${qs({ status: status || undefined })}`)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-navy ring-1 ring-line hover:bg-paper"
            download
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Export CSV
          </a>
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <button
              key={s || "all"}
              onClick={() => set("status", s)}
              aria-pressed={status === s}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${status === s ? "bg-navy text-white" : "bg-white text-charcoal/70 ring-1 ring-line hover:text-navy"}`}
            >
              {s ? enquiryStatusLabel[s] : "All"}
            </button>
          ))}
        </div>
        <div className="relative lg:w-80">
          <label htmlFor="enq-search" className="sr-only">
            Search enquiries
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="enq-search" type="search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Name, email, phone, location" className="field-input py-2.5 pl-10" />
        </div>
      </div>

      {loading && !data && <Spinner />}
      {error && <ErrorState message={error.message} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No enquiries found" text={status || search ? "Try clearing the filters." : "New enquiries will appear here."} />}
      {data && data.length > 0 && (
        <div className="admin-card overflow-hidden">
          {/* Table on wide screens */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-line bg-paper/60 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                <th scope="col" className="px-5 py-3 font-semibold">Project</th>
                <th scope="col" className="px-5 py-3 font-semibold">Received</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((e) => (
                <tr key={e.id} className="hover:bg-paper/60">
                  <td className="px-5 py-3.5">
                    <Link to={`/admin/enquiries/${e.id}`} className="font-semibold hover:text-blue">
                      {e.fullName}
                    </Link>
                    <p className="text-muted">{e.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p>{e.projectType}</p>
                    <p className="text-muted">{e.projectLocation}</p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted">{formatDate(e.createdAt, true)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ${enquiryStatusTone[e.status]}`}>{enquiryStatusLabel[e.status]}</span>
                    {e._count?.notes ? <span className="ml-2 text-xs text-muted">{e._count.notes} note{e._count.notes > 1 ? "s" : ""}</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Cards on mobile */}
          <ul className="divide-y divide-line md:hidden">
            {data.map((e) => (
              <li key={e.id}>
                <Link to={`/admin/enquiries/${e.id}`} className="block p-4 hover:bg-paper/60">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold">{e.fullName}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${enquiryStatusTone[e.status]}`}>{enquiryStatusLabel[e.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {e.projectType} · {e.projectLocation}
                  </p>
                  <p className="mt-1 text-xs text-muted">{formatDate(e.createdAt, true)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {meta && meta.totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-end gap-3 text-sm">
          <span className="text-muted">
            {meta.total} total · page {meta.page} of {meta.totalPages}
          </span>
          <button disabled={page <= 1} onClick={() => set("page", String(page - 1))} className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40" aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button disabled={page >= meta.totalPages} onClick={() => set("page", String(page + 1))} className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40" aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </>
  );
}
