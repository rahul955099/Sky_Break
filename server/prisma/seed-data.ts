/**
 * Demo content for a fresh database.
 * Services describe what Skybreak Infra offers. Projects are ILLUSTRATIVE SAMPLES only
 * (isSample = true) and must be replaced with real work before launch.
 * Photography: Unsplash (https://unsplash.com/license) — see docs/IMAGE_CREDITS.md.
 */

export const img = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const commonWorkflow = [
  { title: "Consultation", description: "We listen to your goals, site context, preferences and constraints." },
  { title: "Planning", description: "Scope, priorities and an indicative approach are agreed before detailed work begins." },
  { title: "Design coordination", description: "We coordinate drawings and specifications with your architect and consultants." },
  { title: "Estimate & proposal", description: "A transparent proposal is prepared based on the agreed scope." },
  { title: "Construction", description: "Work proceeds in planned stages with regular progress updates." },
  { title: "Quality checks & handover", description: "Inspections at key stages, a final walkthrough and a documented handover." },
];

const estimateFaq = {
  question: "How is the cost of my project estimated?",
  answer:
    "Estimates depend on the final scope, design, specifications, site conditions and applicable requirements. After an initial consultation we prepare a written proposal based on the information available. We do not quote fixed prices without understanding the project first.",
};

const timelineFaq = {
  question: "How long will construction take?",
  answer:
    "Timelines vary with project size, design complexity, approvals, material availability and site conditions. A schedule is discussed once the scope is defined, and any changes are communicated openly.",
};

export const services = [
  {
    slug: "residential-construction",
    title: "Residential Construction",
    icon: "home",
    shortDescription: "Thoughtfully built homes, from independent houses to multi-unit residences, delivered with care.",
    intro:
      "A home is one of the most important investments you will make. Skybreak Infra approaches residential construction with attention to durability, comfort and everyday liveability — coordinating design, materials and workmanship so that the finished home reflects how you want to live.",
    heroImageUrl: img("1600585154340-be6161a56a0c"),
    heroImageAlt: "Modern two-storey family home with warm interior lighting at dusk",
    features: [
      "Independent houses, duplexes and row homes",
      "Structure, masonry, finishes and services coordination",
      "Material guidance focused on durability and maintenance",
      "Regular site updates and stage-wise quality checks",
      "Clear documentation at handover",
    ],
    workflow: commonWorkflow,
    faqs: [
      estimateFaq,
      timelineFaq,
      {
        question: "Can you work with my own architect?",
        answer: "Yes. We can coordinate with your appointed architect and consultants, or help you plan the design coordination process.",
      },
    ],
  },
  {
    slug: "luxury-villas-independent-houses",
    title: "Luxury Villas & Independent Houses",
    icon: "gem",
    shortDescription: "Bespoke villas and independent homes with refined detailing and premium finishes.",
    intro:
      "Luxury residences demand precision at every junction — from structural frames that allow generous spans to the alignment of stone, timber and glazing. We work closely with you and your design team to execute distinctive homes with a calm, considered finish.",
    heroImageUrl: img("1613490493576-7fde63acd811"),
    heroImageAlt: "Contemporary luxury villa with a long reflecting pool and white facade",
    features: [
      "Custom villas and architect-designed independent homes",
      "Large openings, cantilevers and feature elements coordinated with consultants",
      "Premium finish execution: stone, timber, glazing and joinery",
      "Landscape, pool and outdoor living coordination",
      "Detailed snagging and handover walkthrough",
    ],
    workflow: commonWorkflow,
    faqs: [
      estimateFaq,
      {
        question: "Do you help with material and finish selection?",
        answer: "We can share practical guidance on durability, availability and maintenance so you and your designer can make informed choices.",
      },
      timelineFaq,
    ],
  },
  {
    slug: "apartments-residential-complexes",
    title: "Apartments & Residential Complexes",
    icon: "building-2",
    shortDescription: "Multi-unit residential buildings planned for efficiency, community and long-term value.",
    intro:
      "Apartment buildings and gated communities bring many homes together, which makes planning, sequencing and consistency essential. We coordinate structure, services and common amenities so residents benefit from well-built homes and well-considered shared spaces.",
    heroImageUrl: img("1460317442991-0ec209397118"),
    heroImageAlt: "Apartment building facade with rows of balconies against a clear sky",
    features: [
      "Mid-rise apartment buildings and residential blocks",
      "Common amenities, parking and landscaped areas",
      "Repeatable quality across units through stage-wise checks",
      "Services coordination for plumbing, electrical and drainage",
      "Phased construction planning",
    ],
    workflow: commonWorkflow,
    faqs: [
      estimateFaq,
      {
        question: "Can a residential complex be built in phases?",
        answer: "Phasing is often possible and is discussed during planning, depending on the site, design and approvals involved.",
      },
    ],
  },
  {
    slug: "commercial-construction",
    title: "Commercial Construction",
    icon: "building",
    shortDescription: "Commercial buildings, warehouses and business spaces built to perform for your operations.",
    intro:
      "Commercial projects must balance speed, budget and functionality. From business buildings to warehouses and light industrial facilities, we focus on dependable planning and coordination so your space is ready to support the way your business works.",
    heroImageUrl: img("1464938050520-ef2270bb8ce8"),
    heroImageAlt: "Glass commercial towers viewed from street level",
    features: [
      "Commercial complexes and mixed-use buildings",
      "Warehouses, storage and light industrial buildings",
      "Structural frames suited to open, flexible floor plates",
      "Coordination of services, access and loading areas",
      "Programme planning to support business timelines",
    ],
    workflow: commonWorkflow,
    faqs: [
      estimateFaq,
      timelineFaq,
      {
        question: "Do you build warehouses and industrial sheds?",
        answer: "Yes, warehouse and industrial construction is part of our commercial work. Requirements are reviewed case by case.",
      },
    ],
  },
  {
    slug: "office-buildings-retail-spaces",
    title: "Office Buildings & Retail Spaces",
    icon: "briefcase",
    shortDescription: "Workplaces, showrooms and retail spaces that make a confident first impression.",
    intro:
      "Offices and retail spaces are part of your brand. We construct and fit out environments that are practical to operate and pleasant to occupy — with attention to light, circulation, finishes and the details customers and teams notice.",
    heroImageUrl: img("1497366811353-6870744d04b2"),
    heroImageAlt: "Bright modern office with glass-walled meeting room and floor-to-ceiling windows",
    features: [
      "Office buildings and corporate interiors",
      "Showrooms, retail units and business spaces",
      "Shell-and-core and fit-out coordination",
      "Finishes, ceilings, partitions and lighting coordination",
      "Work sequencing to limit disruption where premises are occupied",
    ],
    workflow: commonWorkflow,
    faqs: [
      estimateFaq,
      {
        question: "Can you work on an occupied building?",
        answer: "Work in occupied premises is sometimes possible with careful planning, phasing and safety measures. We discuss feasibility during consultation.",
      },
    ],
  },
  {
    slug: "real-estate-development",
    title: "Real Estate Development",
    icon: "landmark",
    shortDescription: "Development-focused construction for residential and commercial property ventures.",
    intro:
      "Successful developments depend on clear planning, disciplined execution and buildings that people want to live and work in. Skybreak Infra supports property development from early planning conversations through construction and handover.",
    heroImageUrl: img("1429497419816-9ca5cfb4571a"),
    heroImageAlt: "Tower cranes above a high-rise building under construction",
    features: [
      "Residential, commercial and mixed-use development",
      "Early-stage planning and feasibility discussions",
      "Construction programme and phasing strategy",
      "Coordination with design and project consultants",
      "Focus on build quality that supports long-term value",
    ],
    workflow: commonWorkflow,
    faqs: [
      {
        question: "Do you partner on land or development ventures?",
        answer: "Development arrangements are discussed individually. Please share your proposal through our enquiry form.",
      },
      timelineFaq,
    ],
  },
  {
    slug: "civil-structural-construction",
    title: "Civil & Structural Construction",
    icon: "hard-hat",
    shortDescription: "Foundations, frames and civil works executed with discipline and safety in mind.",
    intro:
      "The structure is what everything else relies on. We execute foundations, RCC frames, masonry and associated civil works according to the approved structural design, coordinating with the project's qualified structural consultant and maintaining safe site practices.",
    heroImageUrl: img("1504307651254-35680f356dfd"),
    heroImageAlt: "Construction workers in safety gear tying steel reinforcement on site",
    features: [
      "Excavation, foundations and plinth works",
      "Reinforced concrete frames, slabs and staircases",
      "Masonry, plastering and waterproofing",
      "Execution as per approved structural drawings",
      "Stage-wise inspection and site safety practices",
    ],
    workflow: commonWorkflow,
    faqs: [
      {
        question: "Do you provide structural design?",
        answer: "Structural design and certification must be carried out by appropriately qualified professionals. We execute works according to the approved structural design and coordinate with your consultant.",
      },
      estimateFaq,
    ],
  },
  {
    slug: "renovation-remodeling",
    title: "Renovation & Remodeling",
    icon: "hammer",
    shortDescription: "Renovations, extensions and remodeling that give existing spaces a new life.",
    intro:
      "Whether you are updating a home, extending a building or reconfiguring a commercial space, renovation work needs a careful assessment of what exists. We plan the work around the existing structure and your priorities, keeping you informed at every step.",
    heroImageUrl: img("1517581177682-a085bb7ffb15"),
    heroImageAlt: "Interior renovation in progress with exposed brick and new openings",
    features: [
      "Home renovation and interior remodeling",
      "Extensions and additional floors, subject to structural review",
      "Kitchen, bathroom and flooring upgrades",
      "Commercial refurbishment and reconfiguration",
      "Clear scope definition before work begins",
    ],
    workflow: commonWorkflow,
    faqs: [
      {
        question: "Can you add a floor to my existing building?",
        answer: "That depends on the existing structure, approvals and a review by a qualified structural engineer. We can help you understand the steps involved.",
      },
      estimateFaq,
      {
        question: "Can I stay in my home during renovation?",
        answer: "It depends on the scope. We discuss phasing, access and safety so you can decide what works best.",
      },
    ],
  },
  {
    slug: "complete-construction-solutions",
    title: "Complete Construction Solutions",
    icon: "layers",
    shortDescription: "A single coordinated partner from planning and design coordination to handover.",
    intro:
      "For clients who prefer one accountable point of contact, Skybreak Infra coordinates the journey end to end — bringing together planning, design coordination, construction and quality checks into a single, transparent process.",
    heroImageUrl: img("1503387762-592deb58ef4e"),
    heroImageAlt: "Hands reviewing architectural plans and drawings on a desk",
    features: [
      "Single point of coordination across the project",
      "Planning and design coordination with consultants",
      "Procurement and site management",
      "Progress reporting and transparent communication",
      "Quality checks, final inspection and handover",
    ],
    workflow: commonWorkflow,
    faqs: [estimateFaq, timelineFaq],
  },
];

const SAMPLE_NOTE =
  "This is an illustrative sample project used to demonstrate the website. It does not represent completed Skybreak Infra Pvt Ltd work.";

export const projects = [
  {
    slug: "courtyard-villa-sample",
    title: "The Courtyard Villa",
    category: "RESIDENTIAL" as const,
    status: "CONCEPT" as const,
    summary: "A sample luxury villa concept arranged around a reflecting pool and shaded courtyard.",
    description: `${SAMPLE_NOTE}\n\nThe concept explores a single-family villa organised around a central courtyard, with living spaces opening onto a reflecting pool. Deep overhangs shade large glazed openings, while a restrained palette of white render, timber and stone keeps the architecture calm.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1613490493576-7fde63acd811"),
    coverImageAlt: "White contemporary villa with long reflecting pool",
    images: [
      { url: img("1600596542815-ffad4c1539a9"), alt: "Multi-level white villa with terraces beside a pool" },
      { url: img("1600573472550-8090b5e0745e"), alt: "Open-plan interior with floating staircase and pool view" },
      { url: img("1600607687939-ce8a6c25118c"), alt: "Bright living room with neutral furniture and timber accents" },
      { url: img("1512917774080-9991f1c4c750"), alt: "Villa terrace with pool and palms" },
    ],
    specifications: [
      { label: "Typology", value: "Independent luxury villa (concept)" },
      { label: "Scope", value: "Design coordination & construction" },
      { label: "Key features", value: "Courtyard, reflecting pool, deep overhangs" },
    ],
    services: ["luxury-villas-independent-houses", "residential-construction"],
    isFeatured: true,
  },
  {
    slug: "maple-row-homes-sample",
    title: "Maple Row Family Homes",
    category: "RESIDENTIAL" as const,
    status: "CONCEPT" as const,
    summary: "A sample cluster of contemporary family homes with timber detailing and private gardens.",
    description: `${SAMPLE_NOTE}\n\nThis concept imagines a small group of independent family homes with generous glazing, timber-clad volumes and private gardens, planned for comfortable everyday living and low-maintenance materials.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1600585154340-be6161a56a0c"),
    coverImageAlt: "Modern family home with lit interiors at dusk",
    images: [
      { url: img("1600566753190-17f0baa2a6c3"), alt: "Contemporary house with timber cladding and landscaped front" },
      { url: img("1600047509807-ba8f99d2cdde"), alt: "Modern home with timber and dark panel facade" },
      { url: img("1484154218962-a197022b5858"), alt: "White kitchen with pendant lights and island seating" },
    ],
    specifications: [
      { label: "Typology", value: "Independent houses (concept)" },
      { label: "Scope", value: "Residential construction" },
    ],
    services: ["residential-construction"],
    isFeatured: true,
  },
  {
    slug: "skyline-residences-sample",
    title: "Skyline Residences",
    category: "DEVELOPMENT" as const,
    status: "CONCEPT" as const,
    summary: "A sample mid-rise residential development with balconies, shared amenities and green space.",
    description: `${SAMPLE_NOTE}\n\nSkyline Residences illustrates a mid-rise apartment development with private balconies for each home, landscaped common areas and a straightforward structural grid that supports efficient construction.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1574362848149-11496d93a7c7"),
    coverImageAlt: "Mid-rise apartment complex with balconies and lawn",
    images: [
      { url: img("1545324418-cc1a3fa10c00"), alt: "Dark-clad apartment building with recessed balconies" },
      { url: img("1567684014761-b65e2e59b9eb"), alt: "Glass balconies lit at dusk on an apartment tower" },
      { url: img("1600210492486-724fe5c67fb0"), alt: "Sunlit apartment living room with plants" },
    ],
    specifications: [
      { label: "Typology", value: "Apartment development (concept)" },
      { label: "Scope", value: "Development & construction" },
    ],
    services: ["apartments-residential-complexes", "real-estate-development"],
    isFeatured: true,
  },
  {
    slug: "meridian-business-centre-sample",
    title: "Meridian Business Centre",
    category: "COMMERCIAL" as const,
    status: "CONCEPT" as const,
    summary: "A sample office building concept with open floor plates and glass-fronted meeting spaces.",
    description: `${SAMPLE_NOTE}\n\nThe concept shows a commercial office building designed around flexible open floor plates, daylight and efficient services distribution, suitable for a range of tenant layouts.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1486406146926-c627a92ad1ab"),
    coverImageAlt: "Glass office towers rising into the sky",
    images: [
      { url: img("1497366811353-6870744d04b2"), alt: "Office with glass meeting room and city views" },
      { url: img("1531973576160-7125cd663d86"), alt: "Open-plan office with exposed ceiling services" },
      { url: img("1497366216548-37526070297c"), alt: "Clean office corridor with glass partitions" },
    ],
    specifications: [
      { label: "Typology", value: "Office building (concept)" },
      { label: "Scope", value: "Commercial construction & fit-out coordination" },
    ],
    services: ["commercial-construction", "office-buildings-retail-spaces"],
    isFeatured: true,
  },
  {
    slug: "harbourline-retail-sample",
    title: "Harbourline Retail Spaces",
    category: "COMMERCIAL" as const,
    status: "CONCEPT" as const,
    summary: "A sample retail and showroom concept with a bold street-facing facade.",
    description: `${SAMPLE_NOTE}\n\nHarbourline illustrates ground-floor retail units and showrooms with high ceilings, generous shopfront glazing and flexible interiors that tenants can adapt to their brand.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1441986300917-64674bd600d8"),
    coverImageAlt: "Retail interior with display shelving and pendant lights",
    images: [
      { url: img("1448630360428-65456885c650"), alt: "Corner of a contemporary building facade against blue sky" },
      { url: img("1524758631624-e2822e304c36"), alt: "Bright lounge-style commercial interior" },
    ],
    specifications: [
      { label: "Typology", value: "Retail & showroom units (concept)" },
      { label: "Scope", value: "Shell construction & fit-out coordination" },
    ],
    services: ["office-buildings-retail-spaces", "commercial-construction"],
    isFeatured: false,
  },
  {
    slug: "northgate-logistics-sample",
    title: "Northgate Logistics Hub",
    category: "COMMERCIAL" as const,
    status: "CONCEPT" as const,
    summary: "A sample warehouse concept with high-bay storage and efficient loading access.",
    description: `${SAMPLE_NOTE}\n\nThe concept represents a warehouse and distribution building with clear-span storage, durable industrial flooring and well-planned vehicle circulation.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1553413077-190dd305871c"),
    coverImageAlt: "Warehouse interior with tall racking aisles",
    images: [
      { url: img("1586528116311-ad8dd3c8310d"), alt: "Large warehouse floor with organised storage" },
      { url: img("1541888946425-d81bb19240f5"), alt: "Aerial view of a large construction site with workers" },
    ],
    specifications: [
      { label: "Typology", value: "Warehouse / industrial (concept)" },
      { label: "Scope", value: "Civil, structural & commercial construction" },
    ],
    services: ["commercial-construction", "civil-structural-construction"],
    isFeatured: false,
  },
  {
    slug: "lakeview-township-sample",
    title: "Lakeview Urban Homes",
    category: "DEVELOPMENT" as const,
    status: "CONCEPT" as const,
    summary: "A sample urban residential development with crisp modular facades.",
    description: `${SAMPLE_NOTE}\n\nThis concept explores a compact urban residential development, using a modular facade rhythm and a clear structural grid to balance character with construction efficiency.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1515263487990-61b07816b324"),
    coverImageAlt: "Modern apartment building with white and black facade",
    images: [
      { url: img("1479839672679-a46483c0e7c8"), alt: "White modular building facade" },
      { url: img("1534237710431-e2fc698436d0"), alt: "Two slender residential towers against a pale sky" },
    ],
    specifications: [
      { label: "Typology", value: "Urban residential development (concept)" },
      { label: "Scope", value: "Real estate development" },
    ],
    services: ["real-estate-development", "apartments-residential-complexes"],
    isFeatured: true,
  },
  {
    slug: "heritage-home-renovation-sample",
    title: "Heritage Home Renovation",
    category: "RESIDENTIAL" as const,
    status: "CONCEPT" as const,
    summary: "A sample renovation showing how an older home can be opened up and modernised.",
    description: `${SAMPLE_NOTE}\n\nThe sample demonstrates a renovation approach: assessing the existing structure, opening up interiors where feasible, and upgrading kitchens, bathrooms and finishes for modern living.`,
    location: "Location to be confirmed",
    coverImageUrl: img("1517581177682-a085bb7ffb15"),
    coverImageAlt: "Home interior during renovation with exposed brickwork",
    images: [
      { url: img("1513694203232-719a280e022f"), alt: "Renovated living space with natural light" },
      { url: img("1600566752355-35792bedcfea"), alt: "Modern renovated bathroom with freestanding tub" },
      { url: img("1600607687644-c7171b42498f"), alt: "Calm bedroom with large window" },
    ],
    specifications: [
      { label: "Typology", value: "Residential renovation (sample)" },
      { label: "Scope", value: "Renovation & remodeling" },
    ],
    services: ["renovation-remodeling", "residential-construction"],
    isFeatured: false,
  },
];
