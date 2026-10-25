import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Spinner } from "../components/ui/misc";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function PublicLayout() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[200] -translate-y-24 rounded-full bg-navy px-5 py-3 font-semibold text-white transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <motion.main
        id="main"
        key={pathname}
        tabIndex={-1}
        className="outline-none"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        <Suspense fallback={<div className="min-h-[70vh] bg-ink pt-40"><Spinner /></div>}>
          <Outlet />
        </Suspense>
      </motion.main>
      <Footer />
    </>
  );
}
