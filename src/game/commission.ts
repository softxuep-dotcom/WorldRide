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
    id: "italy-oval-arena",
    targetId: "colosseum",
    evidenceIds: [
      "italian-espresso",
      "tuscan-olive-branch",
      "venetian-mask",
      "sicilian-lemons",
    ],
    hintKeys: [
      "commission.colosseum.hint.terrain",
      "commission.colosseum.hint.region",
      "commission.colosseum.hint.espresso",
      "commission.colosseum.hint.olive",
      "commission.colosseum.hint.mask",
      "commission.colosseum.hint.lemons",
      "commission.colosseum.hint.silhouette",
      "commission.hint.reopen",
    ],
    titleKey: "commission.colosseum.offerTitle",
    bodyKey: "commission.colosseum.offerBody",
    acceptedToastKey: "commission.colosseum.acceptedToast",
    objectiveKey: "commission.colosseum.objective",
    completeKey: "commission.colosseum.complete",
    verifiedDetailKey: "commission.colosseum.verifiedDetail",
    clueStrip: "☕ ＋ 🫒 ＋ 🎭 ＋ 🍋 → 🏟️",
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
  {
    id: "australia-white-sails",
    targetId: "sydney-opera-house",
    evidenceIds: [
      "koala",
      "red-kangaroo",
      "eucalyptus-sprig",
      "australian-surfboard",
    ],
    hintKeys: [
      "commission.sydney.hint.terrain",
      "commission.sydney.hint.region",
      "commission.sydney.hint.koala",
      "commission.sydney.hint.kangaroo",
      "commission.sydney.hint.eucalyptus",
      "commission.sydney.hint.surfboard",
      "commission.sydney.hint.silhouette",
      "commission.hint.reopen",
    ],
    titleKey: "commission.sydney.offerTitle",
    bodyKey: "commission.sydney.offerBody",
    acceptedToastKey: "commission.sydney.acceptedToast",
    objectiveKey: "commission.sydney.objective",
    completeKey: "commission.sydney.complete",
    verifiedDetailKey: "commission.sydney.verifiedDetail",
    clueStrip: "🐨 ＋ 🦘 ＋ 🌿 ＋ 🏄 → ⛵⛵",
  },
];

export const MANUAL_COMMISSION_TARGET_IDS: ReadonlySet<PhotoSpotId> =
  new Set(TRAVEL_COMMISSIONS.map((commission) => commission.targetId));

export function getTravelCommission(
  id: string,
): TravelCommissionDefinition | undefined {
  return TRAVEL_COMMISSIONS.find((commission) => commission.id === id);
}
