/**
 * Editorial content that is not managed in the database.
 * Team members and milestones are empty on purpose: add only verified information.
 */
import { img } from "./images";

export const company = {
  overview:
    "Skybreak Infra Pvt Ltd provides construction and property development solutions tailored to client requirements. From individual homes and luxury villas to commercial buildings, apartments and large-scale developments, we combine quality workmanship, thoughtful design, modern construction practices and dependable project coordination.",
  vision:
    "To become a trusted name in construction and real estate development by creating sustainable, innovative and high-quality spaces.",
  mission:
    "To deliver dependable construction solutions through quality workmanship, transparent practices, efficient project management and a customer-first approach.",
};

export const values = [
  { icon: "shield", title: "Quality & durability", text: "Materials and workmanship chosen to perform for years, not just on handover day." },
  { icon: "eye", title: "Transparency", text: "Clear scopes, honest conversations and documentation you can rely on." },
  { icon: "lightbulb", title: "Innovation", text: "Modern methods and thoughtful detailing where they genuinely add value." },
  { icon: "hardhat", title: "Safety", text: "Safe site practices that protect our people, clients and neighbours." },
  { icon: "heart", title: "Customer satisfaction", text: "Your goals guide our decisions, from first meeting to final walkthrough." },
  { icon: "leaf", title: "Responsible construction", text: "Respect for resources, surroundings and the communities we build in." },
  { icon: "trend", title: "Long-term value", text: "Buildings designed to be lived in, maintained and appreciated for decades." },
] as const;

export const approachSteps = [
  { title: "Consultation", text: "We start by understanding your goals, site, budget expectations and timeline." },
  { title: "Planning", text: "Scope, priorities and approach are defined before any commitment is made." },
  { title: "Design coordination", text: "We work with architects and consultants so drawings are buildable and aligned." },
  { title: "Construction", text: "Planned stages, organised sites and regular progress updates." },
  { title: "Quality checks", text: "Inspections at key stages to catch issues early, not after handover." },
  { title: "Handover", text: "A thorough walkthrough, documentation and a clear point of contact." },
];

export const whyChoose = [
  { icon: "clipboard", title: "Quality-focused execution", text: "Stage-wise checks and careful workmanship on every element." },
  { icon: "users", title: "Customer-first approach", text: "Decisions are explained, options are discussed and you stay in control." },
  { icon: "compass", title: "Thoughtful design", text: "Coordination that balances aesthetics, function and buildability." },
  { icon: "message", title: "Transparent communication", text: "Regular updates and straightforward answers, without surprises." },
  { icon: "calendar", title: "Dependable coordination", text: "Planning that keeps trades, materials and approvals moving together." },
  { icon: "trend", title: "Long-term value", text: "Durable choices that keep your building performing over time." },
] as const;

export const processSteps = [
  {
    title: "Initial consultation",
    text: "A conversation about your goals, site, preferences and expectations. There is no obligation at this stage.",
    image: img("1503387762-592deb58ef4e"),
  },
  {
    title: "Requirement gathering",
    text: "We document what you need: spaces, finishes, priorities, constraints and any existing drawings or reports.",
    image: img("1600607687939-ce8a6c25118c"),
  },
  {
    title: "Site & feasibility discussion",
    text: "We review the site and discuss practical considerations such as access, existing conditions and what approvals may apply.",
    image: img("1541888946425-d81bb19240f5"),
  },
  {
    title: "Planning & design coordination",
    text: "We coordinate with your architect and consultants so that the design, structure and services work together.",
    image: img("1487958449943-2429e8be8625"),
  },
  {
    title: "Estimate & proposal",
    text: "A written proposal based on the defined scope, with clear inclusions, exclusions and assumptions.",
    image: img("1497366216548-37526070297c"),
  },
  {
    title: "Project scheduling",
    text: "Stages, milestones and dependencies are planned so materials, trades and inspections line up.",
    image: img("1429497419816-9ca5cfb4571a"),
  },
  {
    title: "Construction & quality checks",
    text: "Work proceeds in planned stages, with quality checks at key points and regular progress updates.",
    image: img("1504307651254-35680f356dfd"),
  },
  {
    title: "Final inspection & handover",
    text: "A joint walkthrough, rectification of any snags, and handover of documentation and keys.",
    image: img("1600585154340-be6161a56a0c"),
  },
];

export const faqs = [
  {
    category: "Getting started",
    items: [
      {
        question: "What types of construction projects do you take on?",
        answer:
          "We work on residential construction (independent houses, duplexes, luxury villas, apartments and residential complexes), commercial construction (offices, retail spaces, showrooms, warehouses and industrial buildings), real estate development, civil and structural works, and renovation, remodeling and extensions.",
      },
      {
        question: "How do I request an estimate?",
        answer:
          "Send us an enquiry through the contact form with as much detail as you can. We will get in touch to discuss your project, and after understanding the scope we can prepare a written proposal. Estimates depend on design, specifications, site conditions and applicable requirements, so we do not quote fixed prices without that understanding.",
      },
      {
        question: "What information do you need to begin?",
        answer:
          "Helpful information includes the site location, the type and approximate size of the building, any existing drawings or surveys, your preferred timeline, an approximate budget range and any must-have features. It's fine if you don't have everything yet — we can help you work through it.",
      },
    ],
  },
  {
    category: "Planning & construction",
    items: [
      {
        question: "How does project planning work?",
        answer:
          "After consultation we define the scope, coordinate with your design team, prepare a proposal and agree a schedule. Each project is planned around its own requirements, site and approvals.",
      },
      {
        question: "What are the typical construction stages?",
        answer:
          "Most projects move through site preparation, foundations, structure, masonry and services, finishes, external works and final inspection. The exact stages depend on the project type and scope.",
      },
      {
        question: "Can you guarantee a completion date?",
        answer:
          "We plan carefully and communicate openly about progress, but timelines can be affected by approvals, weather, material availability and scope changes. We'll agree a realistic schedule with you and keep you informed if anything changes.",
      },
    ],
  },
  {
    category: "Renovation",
    items: [
      {
        question: "Do you handle renovation and remodeling?",
        answer:
          "Yes. We take on home renovations, interior remodeling, extensions and commercial refurbishment. Work on existing structures begins with an assessment, and structural changes require review by a qualified engineer.",
      },
      {
        question: "Can I keep living in my home during renovation?",
        answer: "Sometimes. It depends on the scope and phasing. We'll discuss access, safety and practicalities before work begins.",
      },
    ],
  },
  {
    category: "Enquiries",
    items: [
      {
        question: "What happens after I send an enquiry?",
        answer:
          "Your enquiry is recorded securely and reviewed by our team, who will contact you using the details you provided to discuss next steps. We use your information only to respond to your enquiry, as described in our Privacy Policy.",
      },
    ],
  },
];

/** Add verified team members here (or move to the database later). */
export const team: { name: string; role: string; image?: string; bio?: string }[] = [];

/** Add milestones only when real, verifiable information is available. */
export const milestones: { year: string; title: string; text: string }[] = [];
