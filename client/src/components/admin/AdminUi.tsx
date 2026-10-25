import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck, ImagePlus, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { api, ApiError } from "../../lib/api";
import { imageSrc } from "../../lib/format";
import { Button } from "../ui/Button";

// ── Toasts ─────────────────────────────────────────────────────
type Toast = { id: number; tone: "success" | "error"; text: string };
const ToastContext = createContext<(tone: Toast["tone"], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((tone: Toast["tone"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[300] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 text-sm shadow-lift ring-1 ${
                t.tone === "success" ? "bg-white text-charcoal ring-emerald-200" : "bg-white text-red-700 ring-red-200"
              }`}
              role={t.tone === "error" ? "alert" : "status"}
            >
              {t.tone === "success" ? <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="h-4 w-4 shrink-0" />}
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);

export const errorText = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong");

// ── Confirm dialog ─────────────────────────────────────────────
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[250] grid place-items-center bg-navy-950/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-text"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
              <TriangleAlert className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 id="confirm-title" className="mt-4 font-display text-lg font-bold">
              {title}
            </h2>
            <p id="confirm-text" className="mt-2 text-sm text-muted">
              {text}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelRef} onClick={onClose} className="h-10 rounded-full px-5 text-sm font-semibold ring-1 ring-line hover:bg-paper">
                Cancel
              </button>
              <Button
                variant="danger"
                size="sm"
                className="h-10"
                loading={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onConfirm();
                    onClose();
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Layout helpers ─────────────────────────────────────────────
export function AdminPageHeader({ title, text, actions }: { title: string; text?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {text && <p className="mt-1 text-muted">{text}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <span className="relative">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue peer-focus-visible:ring-4 peer-focus-visible:ring-blue/25" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Image URL field with optional upload to /api/admin/uploads and a live preview. */
export function ImageField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post<{ url: string }>("/admin/uploads", fd);
      onChange(res.data.url);
      toast("success", "Image uploaded");
    } catch (err) {
      toast("error", errorText(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex gap-3">
        <div className="h-[50px] w-[70px] shrink-0 overflow-hidden rounded-lg bg-paper ring-1 ring-line">
          {value && <img src={imageSrc(value, 200)} alt="" className="h-full w-full object-cover" />}
        </div>
        <input id={id} className="field-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload" aria-invalid={error ? "true" : "false"} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-navy ring-1 ring-line hover:bg-paper"
          aria-label={`Upload ${label.toLowerCase()}`}
        >
          {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="hidden sm:inline">Upload</span>
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label={label}>
      <X className="h-4 w-4" />
    </button>
  );
}
