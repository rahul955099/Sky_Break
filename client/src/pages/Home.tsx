import { Seo, useOrganizationJsonLd } from "../components/Seo";
import { Hero } from "../sections/home/Hero";
import { Intro } from "../sections/home/Intro";
import { ServicesShowcase } from "../sections/home/ServicesShowcase";
import { ProjectsShowcase } from "../sections/home/ProjectsShowcase";
import { Capabilities } from "../sections/home/Capabilities";
import { ProcessBuild } from "../sections/home/ProcessBuild";
import { ContactStage } from "../sections/home/ContactStage";

export default function Home() {
  const org = useOrganizationJsonLd();
  return (
    <>
      <Seo jsonLd={org} />
      <Hero />
      <Intro />
      <ServicesShowcase />
      <ProjectsShowcase />
      <Capabilities />
      <ProcessBuild />
      <ContactStage />
    </>
  );
}
