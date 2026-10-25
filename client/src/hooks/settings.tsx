import { createContext, useContext, type ReactNode } from "react";
import { defaultSettings } from "../lib/config";
import type { CompanySettings } from "../types/api";
import { useApi } from "./useApi";

const SettingsContext = createContext<CompanySettings>(defaultSettings);

/** Loads editable company settings from the API, falling back to neutral defaults. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useApi<CompanySettings>("/settings");
  const value = data ? { ...defaultSettings, ...data, socialLinks: data.socialLinks ?? {} } : defaultSettings;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
