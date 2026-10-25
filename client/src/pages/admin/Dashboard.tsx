import { Link } from "react-router-dom";
import { FolderKanban, Inbox, Layers, MailWarning, Sparkles } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { useAuth } from "../../hooks/auth";
import { AdminPageHeader } from "../../components/admin/AdminUi";
import { ErrorState, Spinner } from "../../components/ui/misc";
import { enquiryStatusLabel, enquiryStatusTone, formatDate } from "../../lib/format";
import type { DashboardData, EnquiryStatus } from "../../types/api";

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"];
const BAR: Record<EnquiryStatus, string> = { NEW: "bg-blue", CONTACTED: "bg-amber-500", IN_PROGRESS: "bg-violet-500", CLOSED: "bg-slate-400" };

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi<DashboardData>("/admin/dashboard", { cacheable: false });
  const canSeeEnquiries = user?.role !== "EDITOR";

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error?.message ?? "Couldn't load the dashboard"} onRetry={reload} />;

  const cards = [
    { label: "Total enquiries", value: data.totals.enquiries, icon: Inbox, to: "/admin/enquiries", show: canSeeEnquiries },
    { label: "New enquiries", value: data.totals.newEnquiries, icon: Sparkles, to: "/admin/enquiries?status=NEW", show: canSeeEnquiries },
    { label: "Projects", value: data.totals.projects, sub: `${data.totals.publishedProjects} published`, icon: FolderKanban, to: "/admin/projects", show: true },
    { label: "Services", value: data.totals.services, icon: Layers, to: "/admin/services", show: true },
  ].filter((c) => c.show);
  const max = Math.max(1, ...STATUSES.map((s) => data.enquiriesByStatus[s]));

  return (
    <>
      <AdminPageHeader title={`Welcome, ${user?.name.split(" ")[0] ?? ""}`} text="Here's what's happening across the website." />
      {data.emailDelivery === "disabled" && (
        <p className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-600/20">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Email notifications are not configured. New enquiries are saved here — check this dashboard regularly, or configure SMTP (see README).
        </p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: I, to }) => (
          <li key={label}>
            <Link to={to} className="admin-card group block p-5 transition hover:shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{label}</p>
                <I className="h-4 w-4 text-blue" aria-hidden="true" />
              </div>
              <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">{value}</p>
              {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
            </Link>
          </li>
        ))}
      </ul>

      {canSeeEnquiries && (
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="admin-card p-6" aria-labelledby="status-heading">
            <h2 id="status-heading" className="font-display font-bold">
              Enquiry status
            </h2>
            <ul className="mt-5 space-y-4">
              {STATUSES.map((s) => (
                <li key={s}>
                  <div className="flex justify-between text-sm">
                    <span>{enquiryStatusLabel[s]}</span>
                    <span className="font-semibold tabular-nums">{data.enquiriesByStatus[s]}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
                    <div className={`h-full rounded-full ${BAR[s]}`} style={{ width: `${(data.enquiriesByStatus[s] / max) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="admin-card overflow-hidden xl:col-span-2" aria-labelledby="recent-heading">
            <div className="flex items-center justify-between p-6 pb-3">
              <h2 id="recent-heading" className="font-display font-bold">
                Recent enquiries
              </h2>
              <Link to="/admin/enquiries" className="text-sm font-semibold text-blue hover:underline">
                View all
              </Link>
            </div>
            {data.recentEnquiries.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-muted">No enquiries yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.recentEnquiries.map((e) => (
                  <li key={e.id}>
                    <Link to={`/admin/enquiries/${e.id}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 hover:bg-paper">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.fullName}</p>
                        <p className="truncate text-sm text-muted">
                          {e.projectType} · {e.projectLocation}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">{formatDate(e.createdAt)}</span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${enquiryStatusTone[e.status]}`}>{enquiryStatusLabel[e.status]}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
