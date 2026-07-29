import type { MessageKey } from "../i18n/types";
import type { PhotoSpotId } from "./data";

export interface TravelCommissionDefinition {
  readonly id: string;
  readonly targetId: PhotoSpotId;
  readonly evidenceIds: readonly string[];
  readonly hintKeys: readonly MessageKey[];
  readonly titleKey: MessageKey;
  readonly bodyKey: MessageKey;
  readonly acceptedToastKey: MessageKey;
  readonly objectiveKey: MessageKey;
  readonly completeKey: MessageKey;
  readonly verifiedDetailKey: MessageKey;
  readonly clueStrip: string;
}

export const COMMISSION_HINT_INTERVAL_SECONDS = 15;

export const TRAVEL_COMMISSIONS: readonly TravelCommissionDefinition[] = [
  {
    id: "egypt-three-mountains",
    targetId: "giza-pyramids",
    evidenceIds: [
      "dromedary-camel",
      "papyrus",
      "date-palm",
      "hibiscus-tea",
    ],
    hintKeys: [
      "commission.hint.terrain",
      "commission.hint.region",
      "commission.hint.dromedary",
      "commission.hint.papyrus",
      "commission.hint.datePalm",
      "commission.hint.hibiscus",
      "commission.hint.silhouette",
      "commission.hint.reopen",
    ],
    titleKey: "commission.offerTitle",
    bodyKey: "commission.offerBody",
    acceptedToastKey: "commission.acceptedToast",
    objectiveKey: "commission.objective",
    completeKey: "commission.complete",
    verifiedDetailKey: "commission.verifiedDetail",
    clueStrip: "🏜️ ＋ 〰️ ＋ 🐪 → ▲▲▲",
  },
  {
    id: "china-ridge-dragon",
    targetId: "great-wall",
    evidenceIds: [
      "giant-panda",
      "ningxia-goji",
      "sichuan-paper-umbrella",
      "yunnan-tea",
    ],
    hintKeys: [
      "commission.greatWall.hint.terrain",
      "commission.greatWall.hint.region",
      "commission.greatWall.hint.panda",
      "commission.greatWall.hint.goji",
      "commission.greatWall.hint.umbrella",
      "commission.greatWall.hint.tea",
      "commission.greatWall.hint.silhouette",
      "commission.hint.reopen",
    ],
    titleKey: "commission.greatWall.offerTitle",
    bodyKey: "commission.greatWall.offerBody",
    acceptedToastKey: "commission.greatWall.acceptedToast",
    objectiveKey: "commission.greatWall.objective",
    completeKey: "commission.greatWall.complete",
    verifiedDetailKey: "commission.greatWall.verifiedDetail",
    clueStrip: "🐼 ＋ 🔴 ＋ ☂️ ＋ 🍵 → 🧱〰️⛰️",
  },
];

export const MANUAL_COMMISSION_TARGET_IDS: ReadonlySet<PhotoSpotId> =
  new Set(TRAVEL_COMMISSIONS.map((commission) => commission.targetId));

export function getTravelCommission(
  id: string,
): TravelCommissionDefinition | undefined {
  return TRAVEL_COMMISSIONS.find((commission) => commission.id === id);
}
