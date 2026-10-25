import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Trash2 } from "lucide-react";
import { useApi } from "../../hooks/useApi";
import { api } from "../../lib/api";
import { AdminPageHeader, ConfirmDialog, errorText, useToast } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/Button";
import { ErrorState, Spinner } from "../../components/ui/misc";
import { enquiryStatusLabel, formatDate, telHref } from "../../lib/format";
import type { EnquiryDetail as Enquiry, EnquiryNote, EnquiryStatus } from "../../types/api";

const STATUSES: EnquiryStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "CLOSED"];

export default function EnquiryDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Enquiry>(`/admin/enquiries/${id}`, { cacheable: false });
  const [status, setStatus] = useState<EnquiryStatus | null>(null);
  const [notes, setNotes] = useState<EnquiryNote[] | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (loading) return <Spinner />;
  if (error || !data) return <ErrorState message={error?.message ?? "Enquiry not found"} onRetry={reload} />;
  const currentStatus = status ?? data.status;
  const currentNotes = notes ?? data.notes;

  const changeStatus = async (s: EnquiryStatus) => {
    const prev = currentStatus;
    setStatus(s);
    try {
      await api.patch(`/admin/enquiries/${id}`, { status: s });
      toast("success", `Status set to ${enquiryStatusLabel[s]}`);
    } catch (err) {
      setStatus(prev);
      toast("error", errorText(err));
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      const res = await api.post<EnquiryNote>(`/admin/enquiries/${id}/notes`, { body: note });
      setNotes([res.data, ...currentNotes]);
      setNote("");
    } catch (err) {
      toast("error", errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const rows: [string, string | null][] = [
    ["Project type", data.projectType],
    ["Location", data.projectLocation],
    ["Budget range", data.budgetRange],
    ["Expected start", data.expectedStart],
    ["Submitted from", data.sourcePath],
    ["Received", formatDate(data.createdAt, true)],
    ["Email notification", data.emailNotified ? "Sent" : "Not sent"],
    ["Consent given", data.consent ? "Yes" : "No"],
  ];

  return (
    <>
      <Link to="/admin/enquiries" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-navy">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All enquiries
      </Link>
      <AdminPageHeader
        title={data.fullName}
        text={`Reference ${data.id}`}
        actions={
          <Button variant="secondary" size="sm" onClick={() => setConfirm(true)}>
            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" /> Delete
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="admin-card p-6">
            <div className="flex flex-wrap gap-3">
              <a href={`mailto:${data.email}`} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue">
                <Mail className="h-4 w-4" aria-hidden="true" /> {data.email}
              </a>
              <a href={telHref(data.phone)} className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue">
                <Phone className="h-4 w-4" aria-hidden="true" /> {data.phone}
              </a>
            </div>
            <h2 className="mt-6 font-display font-bold">Message</h2>
            <p className="mt-2 leading-relaxed whitespace-pre-wrap text-charcoal/85">{data.message}</p>
            {data.project && (
              <p className="mt-4 text-sm text-muted">
                Related project:{" "}
                <Link to={`/projects/${data.project.slug}`} target="_blank" className="font-medium text-blue hover:underline">
                  {data.project.title}
                </Link>
              </p>
            )}
          </section>
          <section className="admin-card p-6" aria-labelledby="notes-heading">
            <h2 id="notes-heading" className="font-display font-bold">
              Internal notes
            </h2>
            <label htmlFor="note" className="sr-only">
              Add a note
            </label>
            <textarea id="note" rows={3} className="field-input mt-4" placeholder="Add a note visible only to admins…" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button size="sm" className="mt-3" loading={saving} onClick={addNote} disabled={!note.trim()}>
              Add note
            </Button>
            <ul className="mt-6 space-y-4">
              {currentNotes.map((n) => (
                <li key={n.id} className="rounded-xl bg-paper p-4">
                  <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {n.author?.name ?? "Former admin"} · {formatDate(n.createdAt, true)}
                  </p>
                </li>
              ))}
              {currentNotes.length === 0 && <li className="text-sm text-muted">No notes yet.</li>}
            </ul>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="admin-card p-6">
            <label htmlFor="status" className="font-display font-bold">
              Status
            </label>
            <select id="status" className="field-input mt-3" value={currentStatus} onChange={(e) => changeStatus(e.target.value as EnquiryStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {enquiryStatusLabel[s]}
                </option>
              ))}
            </select>
          </section>
          <section className="admin-card p-6">
            <h2 className="font-display font-bold">Details</h2>
            <dl className="mt-4 divide-y divide-line text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium break-all">{v || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Delete this enquiry?"
        text="The enquiry and its notes will be permanently removed. This cannot be undone."
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          try {
            await api.delete(`/admin/enquiries/${id}`);
            toast("success", "Enquiry deleted");
            navigate("/admin/enquiries", { replace: true });
          } catch (err) {
            toast("error", errorText(err));
          }
        }}
      />
    </>
  );
}
