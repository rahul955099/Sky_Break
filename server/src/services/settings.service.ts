import { prisma } from "../db.js";
import type { SettingsInput } from "../schemas/index.js";
import { BRAND_DEFAULTS } from "../config/brand.js";

const SETTINGS_ID = "default";

/** Returns the single settings row, creating it with neutral defaults on first access. */
export function getSettings() {
  return prisma.companySetting.upsert({ where: { id: SETTINGS_ID }, update: {}, create: { id: SETTINGS_ID, ...BRAND_DEFAULTS } });
}

export function updateSettings(input: SettingsInput) {
  return prisma.companySetting.upsert({
    where: { id: SETTINGS_ID },
    update: input,
    create: { id: SETTINGS_ID, ...input },
  });
}
