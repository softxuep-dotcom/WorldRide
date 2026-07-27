import {
  PHOTO_SPOTS,
  type CountryDefinition,
  type PhotoSpotDefinition,
  type PhotoSpotId,
  MAP_BOUNDS,
  START_POINT,
  geoToWorld,
  worldToGeo,
} from "./data";
import {
  type CountryProfile,
  getCountryProfile,
  getCountryContentForAtlas,
  getWorldCountryAtGeo,
} from "./world-map";
import {
  REGIONAL_SPECIALTIES,
  type RegionalSpecialtyDefinition,
} from "./regional-specialties";

export interface MovementInput {
  x: number;
  z: number;
}

export type VehicleMode = "car" | "boat";

export type GameEvent =
  | { type: "country-entered"; country: CountryProfile; firstVisit: boolean }
  | { type: "mode-changed"; mode: VehicleMode }
  | { type: "cruise-flow" }
  | { type: "map-edge" }
  | { type: "world-wrapped"; deltaX: number }
  | { type: "postcard-collected"; spot: PhotoSpotDefinition; firstCollection: boolean }
  | {
      type: "specialty-discovered";
      specialty: RegionalSpecialtyDefinition;
      firstDiscovery: boolean;
    };

export interface GameState {
  position: { x: number; z: number };
  velocity: { x: number; z: number };
  heading: number;
  vehicleMode: VehicleMode;
  cruiseFlow: number;
  modeTransition: number;
  currentCountry?: CountryDefinition;
  currentCountryProfile?: CountryProfile;
  currentWorldCountryName?: string;
  nearestPhotoSpot?: PhotoSpotDefinition;
  nearestSpecialty?: RegionalSpecialtyDefinition;
  visitedCountries: Set<string>;
  collectedPostcards: Set<PhotoSpotId>;
  discoveredSpecialties: Set<string>;
  elapsed: number;
}

const startWorld = geoToWorld(START_POINT);
const minimumWorld = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
const maximumWorld = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);

export class GameSimulation {
  readonly state: GameState = {
    position: { ...startWorld },
    velocity: { x: 0, z: 0 },
    heading: 0,
    vehicleMode: "car",
    cruiseFlow: 0,
    modeTransition: 0,
    currentCountry: undefined,
    currentCountryProfile: undefined,
    currentWorldCountryName: undefined,
    nearestPhotoSpot: undefined,
    nearestSpecialty: undefined,
    visitedCountries: new Set<string>(),
    collectedPostcards: new Set<PhotoSpotId>(),
    discoveredSpecialties: new Set<string>(),
    elapsed: 0,
  };

  private events: GameEvent[] = [];
  private edgeCooldown = 0;
  private cruiseFlowActive = false;
  private cruiseFlowCueCooldown = 0;

  update(deltaSeconds: number, input: MovementInput): void {
    const dt = Math.min(deltaSeconds, 0.05);
    this.state.elapsed += dt;
    this.edgeCooldown = Math.max(0, this.edgeCooldown - dt);
    this.cruiseFlowCueCooldown = Math.max(
      0,
      this.cruiseFlowCueCooldown - dt,
    );
    this.state.modeTransition = Math.max(
      0,
      this.state.modeTransition - dt / MODE_TRANSITION_SECONDS,
    );

    const inputLength = Math.hypot(input.x, input.z);
    const normalizedX = inputLength > 1 ? input.x / inputLength : input.x;
    const normalizedZ = inputLength > 1 ? input.z / inputLength : input.z;
    const velocityBefore = Math.hypot(
      this.state.velocity.x,
      this.state.velocity.z,
    );
    const directionAlignment =
      velocityBefore < 0.35 || inputLength < 0.01
        ? 1
        : (
            normalizedX * (this.state.velocity.x / velocityBefore) +
            normalizedZ * (this.state.velocity.z / velocityBefore)
          ) / Math.max(0.01, Math.min(1, inputLength));
    const holdingCourse =
      inputLength > 0.72 && directionAlignment > CRUISE_ALIGNMENT;
    const flowTarget = holdingCourse ? 1 : 0;
    const flowResponse = 1 - Math.exp(
      -(holdingCourse ? CRUISE_BUILD_RATE : CRUISE_BREAK_RATE) * dt,
    );
    this.state.cruiseFlow +=
      (flowTarget - this.state.cruiseFlow) * flowResponse;

    if (
      this.state.cruiseFlow >= CRUISE_CUE_THRESHOLD &&
      !this.cruiseFlowActive &&
      this.cruiseFlowCueCooldown === 0
    ) {
      this.cruiseFlowActive = true;
      this.cruiseFlowCueCooldown = CRUISE_CUE_COOLDOWN_SECONDS;
      this.events.push({ type: "cruise-flow" });
    } else if (this.state.cruiseFlow < CRUISE_REARM_THRESHOLD) {
      this.cruiseFlowActive = false;
    }

    const baseSpeed = this.state.vehicleMode === "car" ? 5.6 : 4.5;
    const cruiseBonus =
      1 +
      smoothstep(
        this.state.cruiseFlow,
        CRUISE_SPEED_START,
        1,
      ) *
        CRUISE_SPEED_BONUS;
    const transitionBonus =
      1 +
      this.state.modeTransition *
        (this.state.vehicleMode === "boat"
          ? WATER_ENTRY_SPEED_BONUS
          : LANDING_SPEED_BONUS);
    const speed = baseSpeed * cruiseBonus * transitionBonus;
    const responsiveness = 1 - Math.exp(-8 * dt);

    this.state.velocity.x += (normalizedX * speed - this.state.velocity.x) * responsiveness;
    this.state.velocity.z += (normalizedZ * speed - this.state.velocity.z) * responsiveness;

    if (inputLength < 0.01) {
      const coast = Math.exp(-4.2 * dt);
      this.state.velocity.x *= coast;
      this.state.velocity.z *= coast;
    }

    this.state.position.x += this.state.velocity.x * dt;
    this.state.position.z += this.state.velocity.z * dt;

    const unwrappedX = this.state.position.x;
    let wrappedX = unwrappedX;
    if (wrappedX < minimumWorld.x) {
      wrappedX = maximumWorld.x - 0.8;
    } else if (wrappedX > maximumWorld.x) {
      wrappedX = minimumWorld.x + 0.8;
    }
    this.state.position.x = wrappedX;
    if (wrappedX !== unwrappedX) {
      this.events.push({
        type: "world-wrapped",
        deltaX: wrappedX - unwrappedX,
      });
    }

    const clampedX = this.state.position.x;
    const clampedZ = Math.min(maximumWorld.z - 0.8, Math.max(minimumWorld.z + 0.8, this.state.position.z));
    const hitEdge = clampedZ !== this.state.position.z;

    if (hitEdge) {
      this.state.position.x = clampedX;
      this.state.position.z = clampedZ;
      this.state.velocity.x *= -0.25;
      this.state.velocity.z *= -0.25;
      if (this.edgeCooldown === 0) {
        this.events.push({ type: "map-edge" });
        this.edgeCooldown = 2;
      }
    }

    const velocityLength = Math.hypot(this.state.velocity.x, this.state.velocity.z);
    if (velocityLength > 0.12) {
      const targetHeading = Math.atan2(-this.state.velocity.x, -this.state.velocity.z);
      this.state.heading = dampAngle(this.state.heading, targetHeading, 1 - Math.exp(-10 * dt));
    }

    this.updateLocation();
    this.updateNearestPhotoSpot();
    this.updateNearestSpecialty();
  }

  interact(): void {
    const spot = this.state.nearestPhotoSpot;
    if (!spot) {
      return;
    }

    const firstCollection = !this.state.collectedPostcards.has(spot.id);
    this.state.collectedPostcards.add(spot.id);
    this.events.push({ type: "postcard-collected", spot, firstCollection });
  }

  /**
   * Applies a loaded save. Unknown postcard ids are dropped so a save written
   * by an older content set cannot resurrect spots that no longer exist.
   */
  restore(snapshot: {
    position: { x: number; z: number };
    heading: number;
    elapsed: number;
    visitedCountries: readonly string[];
    collectedPostcards: readonly string[];
    discoveredSpecialties?: readonly string[];
  }): void {
    const knownSpotIds = new Set<string>(PHOTO_SPOTS.map((spot) => spot.id));

    this.state.position.x = clamp(
      snapshot.position.x,
      minimumWorld.x,
      maximumWorld.x,
    );
    this.state.position.z = clamp(
      snapshot.position.z,
      minimumWorld.z + 0.8,
      maximumWorld.z - 0.8,
    );
    this.state.velocity.x = 0;
    this.state.velocity.z = 0;
    this.state.heading = snapshot.heading;
    this.state.elapsed = snapshot.elapsed;
    this.state.cruiseFlow = 0;
    this.state.modeTransition = 0;
    this.cruiseFlowActive = false;
    this.cruiseFlowCueCooldown = 0;

    this.state.visitedCountries = new Set(snapshot.visitedCountries);
    this.state.collectedPostcards = new Set(
      snapshot.collectedPostcards.filter((id): id is PhotoSpotId =>
        knownSpotIds.has(id),
      ),
    );

    const knownSpecialtyIds = new Set(
      REGIONAL_SPECIALTIES.map((specialty) => specialty.id),
    );
    this.state.discoveredSpecialties = new Set(
      (snapshot.discoveredSpecialties ?? []).filter((id) =>
        knownSpecialtyIds.has(id),
      ),
    );

    this.updateLocation();
    this.updateNearestPhotoSpot();
    this.updateNearestSpecialty();
    // Restoring is not an arrival: drop the events it just produced so the
    // player is not greeted by a country reveal for where they already were.
    this.events.length = 0;
    this.state.modeTransition = 0;
  }

  teleport(longitude: number, latitude: number): void {
    const world = geoToWorld([longitude, latitude]);
    this.state.position.x = world.x;
    this.state.position.z = world.z;
    this.state.velocity.x = 0;
    this.state.velocity.z = 0;
    this.state.cruiseFlow = 0;
    this.state.modeTransition = 0;
    this.cruiseFlowActive = false;
    this.updateLocation();
    this.updateNearestPhotoSpot();
  }

  consumeEvents(): GameEvent[] {
    return this.events.splice(0);
  }

  private updateLocation(): void {
    const geoPosition = worldToGeo(
      this.state.position.x,
      this.state.position.z,
    );
    const worldCountry = getWorldCountryAtGeo(geoPosition);
    const nextCountry = getCountryContentForAtlas(worldCountry);
    const nextProfile = worldCountry ? getCountryProfile(worldCountry) : undefined;
    const previousProfile = this.state.currentCountryProfile;
    const nextMode: VehicleMode = worldCountry ? "car" : "boat";

    this.state.currentCountry = nextCountry;
    this.state.currentCountryProfile = nextProfile;
    this.state.currentWorldCountryName = worldCountry?.name;

    if (nextMode !== this.state.vehicleMode) {
      this.state.vehicleMode = nextMode;
      this.state.modeTransition = 1;
      this.events.push({ type: "mode-changed", mode: nextMode });
    }

    if (nextProfile && nextProfile.id !== previousProfile?.id) {
      const firstVisit = !this.state.visitedCountries.has(nextProfile.id);
      if (nextProfile.passportEligible) {
        this.state.visitedCountries.add(nextProfile.id);
      }
      this.events.push({
        type: "country-entered",
        country: nextProfile,
        firstVisit,
      });
    }
  }

  private updateNearestPhotoSpot(): void {
    let nearest: PhotoSpotDefinition | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const spot of PHOTO_SPOTS) {
      const spotWorld = geoToWorld(spot.point);
      const distance = Math.hypot(
        spotWorld.x - this.state.position.x,
        spotWorld.z - this.state.position.z,
      );

      if (distance < 2.6 && distance < nearestDistance) {
        nearest = spot;
        nearestDistance = distance;
      }
    }

    this.state.nearestPhotoSpot = nearest;
  }

  /**
   * Specialties are incidental roadside sightings: driving close enough is
   * itself the discovery, so no button press is required. Landmarks still need
   * a deliberate interaction, which keeps the two tiers feeling different.
   */
  private updateNearestSpecialty(): void {
    let nearest: RegionalSpecialtyDefinition | undefined;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const specialty of REGIONAL_SPECIALTIES) {
      const world = geoToWorld(specialty.point);
      const distance = Math.hypot(
        world.x - this.state.position.x,
        world.z - this.state.position.z,
      );

      if (distance < SPECIALTY_DISCOVERY_RADIUS && distance < nearestDistance) {
        nearest = specialty;
        nearestDistance = distance;
      }
    }

    const previousId = this.state.nearestSpecialty?.id;
    this.state.nearestSpecialty = nearest;

    if (nearest && nearest.id !== previousId) {
      const firstDiscovery = !this.state.discoveredSpecialties.has(nearest.id);
      this.state.discoveredSpecialties.add(nearest.id);
      this.events.push({
        type: "specialty-discovered",
        specialty: nearest,
        firstDiscovery,
      });
    }
  }
}

const SPECIALTY_DISCOVERY_RADIUS = 1.9;
const CRUISE_ALIGNMENT = 0.94;
const CRUISE_BUILD_RATE = 1.35;
const CRUISE_BREAK_RATE = 4.8;
const CRUISE_SPEED_START = 0.48;
const CRUISE_SPEED_BONUS = 0.18;
const CRUISE_CUE_THRESHOLD = 0.82;
const CRUISE_REARM_THRESHOLD = 0.42;
const CRUISE_CUE_COOLDOWN_SECONDS = 7;
const MODE_TRANSITION_SECONDS = 0.82;
const WATER_ENTRY_SPEED_BONUS = 0.34;
const LANDING_SPEED_BONUS = 0.08;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function dampAngle(current: number, target: number, amount: number): number {
  let difference = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (difference < -Math.PI) {
    difference += Math.PI * 2;
  }
  return current + difference * amount;
}

export function getCurrentGeoPosition(state: GameState): readonly [number, number] {
  return worldToGeo(state.position.x, state.position.z);
}
