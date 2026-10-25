import { lazy } from "react";
import { Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./hooks/auth";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import Home from "./pages/Home";

// Route-level code splitting keeps the home page light; the 3D scene is split separately.
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const Projects = lazy(() => import("./pages/Projects"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const Process = lazy(() => import("./pages/Process"));
const Contact = lazy(() => import("./pages/Contact"));
const Faq = lazy(() => import("./pages/Faq"));
const PrivacyPolicy = lazy(() => import("./pages/Legal").then((m) => ({ default: m.PrivacyPolicy })));
const TermsOfUse = lazy(() => import("./pages/Legal").then((m) => ({ default: m.TermsOfUse })));
const NotFound = lazy(() => import("./pages/NotFound"));

const Login = lazy(() => import("./pages/admin/Login"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Enquiries = lazy(() => import("./pages/admin/Enquiries"));
const EnquiryDetail = lazy(() => import("./pages/admin/EnquiryDetail"));
const ProjectsAdmin = lazy(() => import("./pages/admin/ProjectsAdmin"));
const ProjectEditor = lazy(() => import("./pages/admin/ProjectEditor"));
const ServicesAdmin = lazy(() => import("./pages/admin/ServicesAdmin"));
const ServiceEditor = lazy(() => import("./pages/admin/ServiceEditor"));
const SettingsAdmin = lazy(() => import("./pages/admin/SettingsAdmin"));

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="services" element={<Services />} />
        <Route path="services/:slug" element={<ServiceDetail />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:slug" element={<ProjectDetail />} />
        <Route path="process" element={<Process />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="privacy-policy" element={<PrivacyPolicy />} />
        <Route path="terms-of-use" element={<TermsOfUse />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {/* The session check only runs inside /admin, so public visitors never call /api/auth/me. */}
      <Route
        path="admin"
        element={
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        }
      >
        <Route path="login" element={<Login />} />
        <Route element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="enquiries" element={<Enquiries />} />
          <Route path="enquiries/:id" element={<EnquiryDetail />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="services/:id" element={<ServiceEditor />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Route>
      </Route>
    </Routes>
  );
}
