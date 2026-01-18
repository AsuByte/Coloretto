import { en } from "./en";
import { es } from "./es";

export type Translations = typeof es;

export const resources = {
  en,
  es,
};

export type Language = "en" | "es";
