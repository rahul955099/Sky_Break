import { Suspense, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, FolderKanban, Inbox, Layers, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useAuth } from "../hooks/auth";
import { LogoLockup, LogoMark } from "../components/layout/Logo";
import { brand } from "../lib/brand";
import { Spinner } from "../components/ui/misc";
import { Seo } from "../components/Seo";
import { ToastProvider } from "../components/admin/AdminUi";
import type { AdminRole } from "../types/api";

const links: { to: string; label: string; icon: typeof Inbox; min: AdminRole }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, min: "EDITOR" },
  { to: "/admin/enquiries", label: "Enquiries", icon: Inbox, min: "ADMIN" },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban, min: "EDITOR" },
  { to: "/admin/services", label: "Services", icon: Layers, min: "EDITOR" },
  { to: "/admin/settings", label: "Settings", icon: Settings, min: "ADMIN" },
];
const RANK: Record<AdminRole, number> = { EDITOR: 1, ADMIN: 2, OWNER: 3 };

export function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setOpen(false);
  }

  if (loading) return <div className="pt-40"><Spinner label="Checking session" /></div>;
  // Client-side guard for UX only; every admin API is independently protected on the server.
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  const visible = links.filter((l) => RANK[user.role] >= RANK[l.min]);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {visible.map(({ to, label, icon: I }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/admin"}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              isActive ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white"
            }`
          }
        >
          <I className="h-4 w-4" aria-hidden="true" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-3 border-t border-white/10 pt-5">
      <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3.5 text-sm text-white/65 hover:text-white">
        <ExternalLink className="h-4 w-4" aria-hidden="true" /> View website
      </a>
      <div className="px-3.5">
        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
        <p className="truncate text-xs text-white/50">
          {user.email} · {user.role.toLowerCase()}
        </p>
      </div>
      <button
        onClick={async () => {
          await logout();
          navigate("/admin/login", { replace: true });
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </button>
    </div>
  );

  return (
    <ToastProvider>
      <Seo title="Admin" noindex />
      <div className="min-h-screen bg-paper">
        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between bg-navy-950 p-5 lg:flex">
          <div>
            <div className="mb-8">
              <div className="flex justify-center rounded-xl bg-white px-4 py-3 shadow-sm">
                <LogoLockup priority className="w-36" />
              </div>
              <p className="mt-3 text-center text-[0.65rem] font-semibold tracking-[0.2em] text-[#9db6ea] uppercase">Admin dashboard</p>
            </div>
            {nav}
          </div>
          {footer}
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-navy-950 px-4 lg:hidden">
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoMark onDark alt={brand.logoAlt} className="h-6" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-extrabold text-white">{brand.name}</p>
              <p className="text-[0.6rem] font-semibold tracking-[0.18em] text-[#9db6ea] uppercase">Admin dashboard</p>
            </div>
          </div>
          <button onClick={() => setOpen((v) => !v)} className="grid h-10 w-10 place-items-center rounded-lg text-white ring-1 ring-white/20" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="fixed inset-x-0 top-16 z-40 space-y-5 bg-navy-950 p-4 shadow-lift lg:hidden"
            >
              {nav}
              {footer}
            </motion.div>
          )}
        </AnimatePresence>

        <main className="px-4 py-8 sm:px-8 lg:ml-64 lg:px-10 lg:py-10">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </ToastProvider>
  );
}
