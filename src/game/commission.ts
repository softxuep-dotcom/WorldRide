import type { MessageKey } from "../i18n/types";

export const EGYPT_COMMISSION_ID = "egypt-three-mountains";
export const EGYPT_COMMISSION_TARGET_ID = "giza-pyramids";
export const COMMISSION_HINT_INTERVAL_SECONDS = 15;

export const EGYPT_COMMISSION_EVIDENCE_IDS = [
  "dromedary-camel",
  "papyrus",
  "date-palm",
  "hibiscus-tea",
] as const;

export const EGYPT_COMMISSION_HINT_KEYS = [
  "commission.hint.terrain",
  "commission.hint.region",
  "commission.hint.dromedary",
  "commission.hint.papyrus",
  "commission.hint.datePalm",
  "commission.hint.hibiscus",
  "commission.hint.silhouette",
  "commission.hint.reopen",
] as const satisfies readonly MessageKey[];
