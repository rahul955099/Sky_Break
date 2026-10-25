import { Seo } from "../components/Seo";
import { ButtonLink } from "../components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" noindex />
      <section className="relative isolate flex min-h-[85vh] items-center overflow-hidden bg-ink pt-24 text-white">
        <div className="perspective-floor absolute inset-x-[-25%] bottom-0 -z-10 h-[65%]" aria-hidden="true" />
        <div className="container-x relative">
          <p className="font-display text-[clamp(6rem,22vw,16rem)] leading-none font-extrabold tracking-tighter text-white/10">404</p>
          <h1 className="display-lg -mt-6 text-white sm:-mt-12">This page isn't on the plans.</h1>
          <p className="lead mt-5 max-w-xl text-white/70">The page you're looking for may have moved or no longer exists.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/" arrow>
              Back to home
            </ButtonLink>
            <ButtonLink to="/projects" variant="outline-light">
              Explore projects
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
