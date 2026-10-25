import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { CircleAlert, Eye, EyeOff, KeyRound } from "lucide-react";
import { useAuth } from "../../hooks/auth";
import { errorText } from "../../components/admin/AdminUi";
import { Button } from "../../components/ui/Button";
import { LogoLockup } from "../../components/layout/Logo";
import { brand } from "../../lib/brand";
import { Seo } from "../../components/Seo";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  return (
    <div className="relative grid min-h-screen place-items-center isolate overflow-hidden bg-ink px-4 py-10">
      <Seo title="Admin sign in" noindex />
      <div className="perspective-floor absolute inset-x-[-25%] bottom-0 -z-10 h-[60%]" aria-hidden="true" />
      <div className="absolute top-[-30%] left-1/2 -z-10 h-[70%] w-[70%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(51_96_181/0.3),transparent)]" aria-hidden="true" />
      <form
        className="relative w-full max-w-sm rounded-[24px] bg-white p-8 shadow-lift"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await login(email, password);
            navigate(from, { replace: true });
          } catch (err) {
            setError(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="flex justify-center border-b border-line pb-6">
          <LogoLockup priority className="w-44" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-extrabold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Authorised {brand.name} staff only.</p>
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input id="email" type="email" autoComplete="username" required className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
                className="field-input pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 right-2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-paper" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
          </p>
        )}
        <Button type="submit" className="mt-6 w-full" loading={busy}>
          <KeyRound className="h-4 w-4" aria-hidden="true" /> Sign in
        </Button>
      </form>
    </div>
  );
}
