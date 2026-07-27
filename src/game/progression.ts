import {
  MAP_BOUNDS,
  PHOTO_SPOTS,
  type PhotoSpotId,
  geoToWorld,
} from "./data";

/**
 * Trips and vehicle paints: the part of the loop that gives a session a shape
 * and an exit.
 *
 * A trip is a short itinerary of uncollected landmarks. It turns open-ended
 * roaming into something with a beginning and an end, so a session can be
 * *finished* rather than merely abandoned. Paints are what the collection
 * finally buys: the only reward that shows up in the world itself.
 */

export const TRIP_SIZE = 3;

/** How many nearby candidates a trip is drawn from, for route variety. */
const TRIP_CANDIDATE_POOL = 10;

const MIN_WORLD = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
const MAX_WORLD = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);
const WORLD_WIDTH = MAX_WORLD.x - MIN_WORLD.x;

/** Shortest signed x offset, accounting for the east–west world wrap. */
export function wrappedDeltaX(targetX: number, playerX: number): number {
  let dx = targetX - playerX;
  if (dx > WORLD_WIDTH / 2) {
    dx -= WORLD_WIDTH;
  } else if (dx < -WORLD_WIDTH / 2) {
    dx += WORLD_WIDTH;
  }
  return dx;
}

/**
 * Picks a fresh itinerary near the player. The closest landmark is always
 * included so a trip opens with an achievable first stop; the rest are drawn
 * from a wider pool so repeat trips do not always follow the same road.
 */
export function buildTrip(
  collected: ReadonlySet<string>,
  position: { x: number; z: number },
): PhotoSpotId[] {
  const candidates = PHOTO_SPOTS.filter(
    (spot) => !collected.has(spot.id),
  ).map((spot) => {
    const world = geoToWorld(spot.point);
    return {
      id: spot.id,
      distance: Math.hypot(
        wrappedDeltaX(world.x, position.x),
        world.z - position.z,
      ),
    };
  });

  if (candidates.length === 0) {
    return [];
  }

  candidates.sort((a, b) => a.distance - b.distance);
  const pool = candidates.slice(0, TRIP_CANDIDATE_POOL);
  const trip: PhotoSpotId[] = [pool[0].id];
  const rest = pool.slice(1);

  while (trip.length < TRIP_SIZE && rest.length > 0) {
    const index = Math.floor(Math.random() * rest.length);
    trip.push(rest[index].id);
    rest.splice(index, 1);
  }
  return trip;
}

/** Keeps only ids that still exist, so old saves cannot resurrect dead spots. */
export function sanitizeTrip(ids: readonly string[]): PhotoSpotId[] {
  const known = new Set<string>(PHOTO_SPOTS.map((spot) => spot.id));
  return ids.filter((id): id is PhotoSpotId => known.has(id));
}

export type UnlockRequirementType =
  | "trips"
  | "landmarks"
  | "countries"
  | "specialties";

export interface UnlockRequirement {
  readonly type: UnlockRequirementType;
  readonly count: number;
}

export interface VehiclePaint {
  readonly id: string;
  /** Body colour applied to the travel car and boat hull. */
  readonly color: number;
  readonly requirement?: UnlockRequirement;
}

/** Progress totals a paint requirement is measured against. */
export interface ProgressTotals {
  readonly trips: number;
  readonly landmarks: number;
  readonly countries: number;
  readonly specialties: number;
}

export const DEFAULT_PAINT_ID = "coral";

/**
 * Requirements are spread across every collection track on purpose: whichever
 * way a player likes to travel, something is always close to unlocking.
 */
export const VEHICLE_PAINTS: readonly VehiclePaint[] = [
  { id: DEFAULT_PAINT_ID, color: 0xff6c55 },
  { id: "sky", color: 0x4ca8d8, requirement: { type: "trips", count: 1 } },
  { id: "forest", color: 0x3f9a6a, requirement: { type: "landmarks", count: 10 } },
  { id: "sand", color: 0xd8a860, requirement: { type: "countries", count: 15 } },
  { id: "berry", color: 0xb85a8a, requirement: { type: "specialties", count: 12 } },
  { id: "midnight", color: 0x33456b, requirement: { type: "trips", count: 3 } },
  { id: "gold", color: 0xe0a72e, requirement: { type: "landmarks", count: 30 } },
  { id: "aurora", color: 0x5fc9b0, requirement: { type: "trips", count: 8 } },
];

export function getPaint(id: string): VehiclePaint {
  return (
    VEHICLE_PAINTS.find((paint) => paint.id === id) ??
    VEHICLE_PAINTS[0]
  );
}

export function meetsRequirement(
  requirement: UnlockRequirement,
  totals: ProgressTotals,
): boolean {
  return totals[requirement.type] >= requirement.count;
}

/** Every paint whose requirement is satisfied (the default is always in). */
export function evaluateUnlockedPaints(totals: ProgressTotals): string[] {
  return VEHICLE_PAINTS.filter(
    (paint) => !paint.requirement || meetsRequirement(paint.requirement, totals),
  ).map((paint) => paint.id);
}
