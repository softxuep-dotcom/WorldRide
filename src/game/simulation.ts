import {
  PHOTO_SPOTS,
  type CountryDefinition,
  type CountryId,
  type PhotoSpotDefinition,
  type PhotoSpotId,
  MAP_BOUNDS,
  START_POINT,
  geoToWorld,
  worldToGeo,
} from "./data";
import {
  getCountryContentForAtlas,
  getWorldCountryAtGeo,
} from "./world-map";

export interface MovementInput {
  x: number;
  z: number;
}

export type VehicleMode = "car" | "boat";

export type GameEvent =
  | { type: "country-entered"; country: CountryDefinition; firstVisit: boolean }
  | { type: "mode-changed"; mode: VehicleMode }
  | { type: "map-edge" }
  | { type: "postcard-collected"; spot: PhotoSpotDefinition; firstCollection: boolean };

export interface GameState {
  position: { x: number; z: number };
  velocity: { x: number; z: number };
  heading: number;
  vehicleMode: VehicleMode;
  currentCountry?: CountryDefinition;
  currentWorldCountryName?: string;
  nearestPhotoSpot?: PhotoSpotDefinition;
  visitedCountries: Set<CountryId>;
  collectedPostcards: Set<PhotoSpotId>;
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
    currentCountry: undefined,
    currentWorldCountryName: undefined,
    nearestPhotoSpot: undefined,
    visitedCountries: new Set<CountryId>(),
    collectedPostcards: new Set<PhotoSpotId>(),
    elapsed: 0,
  };

  private events: GameEvent[] = [];
  private edgeCooldown = 0;

  update(deltaSeconds: number, input: MovementInput): void {
    const dt = Math.min(deltaSeconds, 0.05);
    this.state.elapsed += dt;
    this.edgeCooldown = Math.max(0, this.edgeCooldown - dt);

    const inputLength = Math.hypot(input.x, input.z);
    const normalizedX = inputLength > 1 ? input.x / inputLength : input.x;
    const normalizedZ = inputLength > 1 ? input.z / inputLength : input.z;
    const speed = this.state.vehicleMode === "car" ? 5.6 : 4.5;
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

    let wrappedX = this.state.position.x;
    if (wrappedX < minimumWorld.x) {
      wrappedX = maximumWorld.x - 0.8;
    } else if (wrappedX > maximumWorld.x) {
      wrappedX = minimumWorld.x + 0.8;
    }
    this.state.position.x = wrappedX;

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

  teleport(longitude: number, latitude: number): void {
    const world = geoToWorld([longitude, latitude]);
    this.state.position.x = world.x;
    this.state.position.z = world.z;
    this.state.velocity.x = 0;
    this.state.velocity.z = 0;
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
    const previousCountry = this.state.currentCountry;
    const nextMode: VehicleMode = worldCountry ? "car" : "boat";

    this.state.currentCountry = nextCountry;
    this.state.currentWorldCountryName = worldCountry?.name;

    if (nextMode !== this.state.vehicleMode) {
      this.state.vehicleMode = nextMode;
      this.events.push({ type: "mode-changed", mode: nextMode });
    }

    if (nextCountry && nextCountry.id !== previousCountry?.id) {
      const firstVisit = !this.state.visitedCountries.has(nextCountry.id);
      this.state.visitedCountries.add(nextCountry.id);
      this.events.push({ type: "country-entered", country: nextCountry, firstVisit });
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
