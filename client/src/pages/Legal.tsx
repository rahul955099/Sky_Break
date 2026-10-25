import { TriangleAlert } from "lucide-react";
import { Seo } from "../components/Seo";
import { PageHero } from "../components/PageHero";
import { useSettings } from "../hooks/settings";

/**
 * Starter legal content. Items marked [REVIEW] must be completed and checked by a
 * qualified legal adviser for the company's jurisdiction before publication.
 */
function ReviewNotice() {
  return (
    <p className="mb-10 flex items-start gap-3 rounded-2xl bg-amber-50 p-5 text-sm text-amber-800 ring-1 ring-amber-600/20">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      Draft starter text. Company-specific details (legal entity, registered address, jurisdiction and contact for privacy
      requests) must be completed and reviewed by a legal professional before publication.
    </p>
  );
}

const Review = ({ children }: { children: string }) => (
  <mark className="rounded bg-amber-100 px-1 text-amber-900">[REVIEW: {children}]</mark>
);

export function PrivacyPolicy() {
  const s = useSettings();
  return (
    <>
      <Seo title="Privacy Policy" description={`How ${s.companyName} collects, uses and protects personal information.`} />
      <PageHero eyebrow="Legal" title="Privacy Policy" crumbs={[{ to: "/", label: "Home" }, { label: "Privacy Policy" }]} />
      <article className="container-x max-w-3xl pb-24">
        <ReviewNotice />
        <div className="prose-sb">
          <p>
            This Privacy Policy explains how {s.companyName} (“we”, “us”) collects, uses and protects personal information when you
            visit this website or send us an enquiry. Legal entity name: <Review>registered company name and number</Review>.
          </p>
          <h2>Information we collect</h2>
          <ul>
            <li>Details you submit in our enquiry form: name, email address, phone number, project type and location, optional budget range and start date, and your message.</li>
            <li>Limited technical information needed to operate and secure the website, such as a one-way hashed version of your IP address and your browser's user-agent, used to prevent spam and abuse.</li>
          </ul>
          <h2>How we use your information</h2>
          <ul>
            <li>To respond to your enquiry and discuss your project.</li>
            <li>To keep internal records of enquiries and our communications with you.</li>
            <li>To protect the website against spam, abuse and security threats.</li>
          </ul>
          <p>We do not sell your personal information. We do not use it for unrelated marketing without your separate consent.</p>
          <h2>Legal basis</h2>
          <p>
            We process enquiry data on the basis of your consent and our legitimate interest in responding to requests.{" "}
            <Review>confirm applicable data-protection law and legal bases</Review>
          </p>
          <h2>Retention</h2>
          <p>
            We keep enquiry records only as long as needed for the purposes above. <Review>state the retention period</Review>
          </p>
          <h2>Sharing</h2>
          <p>
            Information may be processed by service providers who host this website, its database and (if enabled) email delivery,
            under appropriate safeguards. <Review>list hosting / email providers and locations</Review>
          </p>
          <h2>Cookies</h2>
          <p>
            The public website does not use advertising or analytics cookies. A strictly necessary, secure session cookie is used
            only when an authorised administrator signs in to the admin area.
          </p>
          <h2>Your rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct or delete your personal information, or to
            withdraw consent. To make a request, contact us at{" "}
            {s.contactEmail ? <a href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a> : <Review>privacy contact email</Review>}.
          </p>
          <h2>Changes</h2>
          <p>
            We may update this policy from time to time. Last updated: <Review>date</Review>.
          </p>
        </div>
      </article>
    </>
  );
}

export function TermsOfUse() {
  const s = useSettings();
  return (
    <>
      <Seo title="Terms of Use" description={`Terms governing the use of the ${s.companyName} website.`} />
      <PageHero eyebrow="Legal" title="Terms of Use" crumbs={[{ to: "/", label: "Home" }, { label: "Terms of Use" }]} />
      <article className="container-x max-w-3xl pb-24">
        <ReviewNotice />
        <div className="prose-sb">
          <p>By using this website you agree to these Terms of Use. If you do not agree, please do not use the website.</p>
          <h2>Information on this website</h2>
          <p>
            Content on this website is provided for general information only. It does not constitute an offer, quotation,
            professional advice or a binding commitment. Any project scope, price, timeline or deliverable is subject to a separate
            written agreement.
          </p>
          <h2>Sample projects and imagery</h2>
          <p>
            Some projects and images are illustrative samples used to demonstrate our services and are clearly labelled as such.
            Photography may be sourced from licensed image libraries.
          </p>
          <h2>Enquiries</h2>
          <p>
            Submitting an enquiry does not create a contract. We will respond at our discretion and may decline enquiries. Please
            don't submit confidential information you are not authorised to share.
          </p>
          <h2>Acceptable use</h2>
          <p>
            You must not misuse the website, attempt to gain unauthorised access to it or its admin area, submit spam, or interfere
            with its operation.
          </p>
          <h2>Intellectual property</h2>
          <p>
            The {s.companyName} name, logo and original website content belong to {s.companyName} or its licensors. Third-party
            images remain the property of their respective owners.
          </p>
          <h2>Limitation of liability</h2>
          <p>
            To the extent permitted by law, we are not liable for losses arising from reliance on general information on this
            website. <Review>confirm wording for applicable law</Review>
          </p>
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of <Review>jurisdiction</Review>.
          </p>
          <p>
            Last updated: <Review>date</Review>.
          </p>
        </div>
      </article>
    </>
  );
}
