import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import App from "./App";
import { SettingsProvider } from "./hooks/settings";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* "user" honours the OS reduced-motion setting for all motion components */}
      <MotionConfig reducedMotion="user">
        <SettingsProvider>
          <Suspense fallback={null}>
            <App />
          </Suspense>
        </SettingsProvider>
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
);
