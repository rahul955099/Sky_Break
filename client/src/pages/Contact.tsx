import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { EnquiryForm } from "../components/EnquiryForm";
import { Reveal } from "../components/ui/Reveal";
import { useSettings } from "../hooks/settings";
import { telHref, whatsappHref } from "../lib/format";

export default function Contact() {
  const s = useSettings();
  const details = [
    s.phone && { icon: Phone, label: "Phone", value: s.phone, href: telHref(s.phone) },
    s.whatsapp && { icon: MessageCircle, label: "WhatsApp", value: s.whatsapp, href: whatsappHref(s.whatsapp) },
    s.contactEmail && { icon: Mail, label: "Email", value: s.contactEmail, href: `mailto:${s.contactEmail}` },
    s.address && { icon: MapPin, label: "Office", value: s.address },
    s.officeHours && { icon: Clock, label: "Office hours", value: s.officeHours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];

  return (
    <>
      <Seo title="Contact" description="Send Skybreak Infra Pvt Ltd an enquiry about your residential, commercial or development project." />
      <PageHero
        eyebrow="Contact"
        title="Tell us what you'd like to build."
        lead="Share a few details about your project. Our team will review your enquiry and get in touch to discuss next steps."
        crumbs={[{ to: "/", label: "Home" }, { label: "Contact" }]}
      />
      <section className="container-x grid gap-12 pb-24 sm:pb-32 lg:grid-cols-12 lg:gap-16">
        <Reveal className="rounded-[28px] border border-line bg-white p-6 shadow-soft sm:p-10 lg:col-span-8">
          <h2 className="font-display text-2xl font-bold">Project enquiry</h2>
          <p className="mt-2 mb-8 text-muted">Fields marked * are required.</p>
          <EnquiryForm />
        </Reveal>
        <aside className="space-y-6 lg:col-span-4">
          {details.length > 0 ? (
            <Reveal delay={0.1} className="rounded-[28px] bg-navy-950 p-8 text-white">
              <h2 className="font-display text-xl font-bold">Contact details</h2>
              <ul className="mt-6 space-y-6">
                {details.map(({ icon: I, label, value, href }) => (
                  <li key={label} className="flex gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-[#8fb3ff]">
                      <I className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-[0.16em] text-white/50 uppercase">{label}</p>
                      {href ? (
                        <a href={href} className="mt-1 block font-medium break-words hover:underline" {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}>
                          {value}
                        </a>
                      ) : (
                        <p className="mt-1 font-medium whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : (
            <Reveal delay={0.1} className="rounded-[28px] bg-paper p-8">
              <h2 className="font-display text-xl font-bold">Prefer to talk?</h2>
              <p className="mt-3 leading-relaxed text-muted">
                Use the enquiry form and include your preferred contact time — our team will reach out to you directly.
              </p>
            </Reveal>
          )}
          <Reveal delay={0.15} className="rounded-[28px] bg-paper p-8">
            <h2 className="font-display text-xl font-bold">What happens next?</h2>
            <ol className="mt-5 space-y-4 text-[0.95rem] text-charcoal/85">
              {["We review your enquiry.", "We contact you to understand your project.", "If it's a good fit, we discuss scope and next steps."].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="font-display font-bold text-blue">{i + 1}.</span>
                  {t}
                </li>
              ))}
            </ol>
          </Reveal>
        </aside>
      </section>
    </>
  );
}
