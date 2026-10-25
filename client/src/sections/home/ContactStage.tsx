import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { EnquiryForm } from "../../components/EnquiryForm";
import { Reveal, TextReveal } from "../../components/ui/Reveal";
import { useSettings } from "../../hooks/settings";
import { telHref, whatsappHref } from "../../lib/format";

/** Dark architectural stage: receding floor grid, soft key light, and the existing enquiry form. */
export function ContactStage() {
  const s = useSettings();
  const details = [
    s.phone && { icon: Phone, label: "Phone", value: s.phone, href: telHref(s.phone) },
    s.whatsapp && { icon: MessageCircle, label: "WhatsApp", value: s.whatsapp, href: whatsappHref(s.whatsapp) },
    s.contactEmail && { icon: Mail, label: "Email", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    s.address && { icon: MapPin, label: "Office", value: s.address },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <section className="relative isolate overflow-hidden bg-ink py-24 text-white sm:py-36" aria-labelledby="contact-heading">
      <div className="perspective-floor absolute inset-x-[-25%] bottom-0 -z-10 h-[60%]" aria-hidden="true" />
      <div className="absolute top-[-30%] left-1/2 -z-10 h-[70%] w-[80%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(51_96_181/0.35),transparent)]" aria-hidden="true" />
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow text-blue-300">Start a conversation</p>
          </Reveal>
          <h2 id="contact-heading" className="display-lg mt-5 text-white">
            <TextReveal text="Let's talk about your project." />
          </h2>
          <Reveal delay={0.1}>
            <p className="lead mt-6 text-white/70">
              Share a few details and our team will be in touch to discuss your requirements and the next steps — with no obligation.
            </p>
          </Reveal>
          {details.length > 0 && (
            <Reveal delay={0.15}>
              <ul className="mt-10 space-y-5">
                {details.map(({ icon: I, label, value, href }) => (
                  <li key={label} className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/8 text-blue-300 ring-1 ring-white/10">
                      <I className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-white/45 uppercase">{label}</p>
                      {href ? (
                        <a href={href} className="mt-0.5 block font-medium break-words hover:text-blue-300" {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}>
                          {value}
                        </a>
                      ) : (
                        <p className="mt-0.5 font-medium whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          <Reveal delay={0.2}>
            <ol className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3 lg:grid-cols-1">
              {["We review your enquiry", "We call to understand the project", "We agree scope and next steps"].map((t, i) => (
                <li key={t} className="flex items-center gap-3 text-sm text-white/75">
                  <span className="font-display text-xs font-bold text-blue-300 tabular-nums">0{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <Reveal delay={0.1} className="rounded-[28px] bg-white p-6 text-charcoal shadow-[0_40px_120px_-40px_rgb(0_0_0/0.7)] sm:p-10 lg:col-span-7">
          <h3 className="font-display text-2xl font-bold">Project enquiry</h3>
          <p className="mt-1 mb-8 text-sm text-muted">Fields marked * are required.</p>
          <EnquiryForm />
        </Reveal>
      </div>
    </section>
  );
}
