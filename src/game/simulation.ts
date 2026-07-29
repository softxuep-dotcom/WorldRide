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
import {
  ARCADE_COURSE_OBJECTS,
  type ArcadeCourseObject,
} from "./arcade-course";

export interface MovementInput {
  x: number;
  z: number;
  boost?: boolean;
  /** Screen-relative target direction used by touch steering. */
  directional?: boolean;
}

export type VehicleMode = "car" | "boat";

export type GameEvent =
  | { type: "country-entered"; country: CountryProfile; firstVisit: boolean }
  | { type: "mode-changed"; mode: VehicleMode }
  | { type: "cruise-flow" }
  | { type: "map-edge" }
  | { type: "world-wrapped"; deltaX: number }
  | {
      type: "postcard-collected";
      spot: PhotoSpotDefinition;
      firstCollection: boolean;
      /** True when arriving collected it, rather than a deliberate press. */
      automatic?: boolean;
    }
  | {
      type: "specialty-discovered";
      specialty: RegionalSpecialtyDefinition;
      firstDiscovery: boolean;
    }
  | { type: "boost-started" }
  | { type: "ramp-launched"; ramp: ArcadeCourseObject }
  | {
      type: "arcade-hit";
      object: ArcadeCourseObject;
      points: number;
      combo: number;
      impulse: { x: number; z: number };
    }
  | {
      type: "arcade-near-miss";
      object: ArcadeCourseObject;
      points: number;
      combo: number;
    }
  | {
      type: "drift-completed";
      seconds: number;
      points: number;
      combo: number;
    }
  | {
      type: "jump-landed";
      seconds: number;
      points: number;
      combo: number;
    }
  | { type: "water-rebound"; points: number; combo: number }
  | { type: "combo-ended"; combo: number }
  | { type: "special-event-started"; event: "ufo" }
  | { type: "special-event-ended"; event: "ufo" };

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
  destroyedArcadeObjects: Set<string>;
  elapsed: number;
  drift: number;
  boostCharge: number;
  boosting: boolean;
  airHeight: number;
  verticalVelocity: number;
  airTime: number;
  combo: number;
  comboTimer: number;
  lastComboAward: number;
  arcadeScore: number;
  specialEvent?: "ufo";
  specialEventRemaining: number;
}

const startWorld = geoToWorld(START_POINT);
const minimumWorld = geoToWorld([MAP_BOUNDS.minLongitude, MAP_BOUNDS.maxLatitude]);
const maximumWorld = geoToWorld([MAP_BOUNDS.maxLongitude, MAP_BOUNDS.minLatitude]);

/**
 * Face north-west out of Paris. Heading 0 pointed due north, which is one of
 * the three directions where the next landmark is over fifty seconds away;
 * north-west reaches Big Ben in about a second, so the first instinctive drag
 * forward now runs into content instead of open sea.
 */
const START_HEADING = Math.PI / 4;

export class GameSimulation {
  readonly state: GameState = {
    position: { ...startWorld },
    velocity: { x: 0, z: 0 },
    heading: START_HEADING,
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
    destroyedArcadeObjects: new Set<string>(),
    elapsed: 0,
    drift: 0,
    boostCharge: 0.42,
    boosting: false,
    airHeight: 0,
    verticalVelocity: 0,
    airTime: 0,
    combo: 0,
    comboTimer: 0,
    lastComboAward: 0,
    arcadeScore: 0,
    specialEvent: undefined,
    specialEventRemaining: 0,
  };

  private events: GameEvent[] = [];
  private edgeCooldown = 0;
  private cruiseFlowActive = false;
  private cruiseFlowCueCooldown = 0;
  private driftActive = false;
  private driftSeconds = 0;
  private boostActive = false;
  private activeRampId?: string;
  private readonly nearMissedArcadeObjects = new Set<string>();
  private waterReboundCooldown = 0;
  private nextSpecialEventAt = SPECIAL_EVENT_FIRST_SECONDS;

  update(deltaSeconds: number, input: MovementInput): void {
    const dt = Math.min(deltaSeconds, 0.05);
    this.state.elapsed += dt;
    this.edgeCooldown = Math.max(0, this.edgeCooldown - dt);
    this.waterReboundCooldown = Math.max(0, this.waterReboundCooldown - dt);
    this.cruiseFlowCueCooldown = Math.max(
      0,
      this.cruiseFlowCueCooldown - dt,
    );
    this.updateCombo(dt);
    this.updateSpecialEvent(dt);
    this.state.modeTransition = Math.max(
      0,
      this.state.modeTransition - dt / MODE_TRANSITION_SECONDS,
    );

    const directionalStrength = input.directional
      ? clamp(Math.hypot(input.x, input.z), 0, 1)
      : 0;
    const desiredHeading =
      input.directional && directionalStrength > 0.03
        ? Math.atan2(-input.x, -input.z)
        : this.state.heading;
    const directionalHeadingError = shortestAngleDelta(
      this.state.heading,
      desiredHeading,
    );
    const directionalAlignment = Math.cos(directionalHeadingError);
    const throttle = input.directional
      ? directionalStrength *
        lerp(
          0.18,
          1,
          smoothstep(directionalAlignment, -0.08, 0.92),
        )
      : clamp(-input.z, -1, 1);
    const steering = input.directional
      ? clamp(
          -directionalHeadingError / DIRECTIONAL_FULL_STEER_ANGLE,
          -1,
          1,
        )
      : clamp(input.x, -1, 1);
    const velocityBefore = Math.hypot(
      this.state.velocity.x,
      this.state.velocity.z,
    );
    const wantsBoost =
      input.boost === true &&
      (Math.abs(throttle) > 0.08 || velocityBefore > 0.5);
    this.state.boosting = wantsBoost && this.state.boostCharge > 0.015;
    if (this.state.boosting) {
      this.state.boostCharge = Math.max(
        0,
        this.state.boostCharge - BOOST_DRAIN_RATE * dt,
      );
      if (!this.boostActive) {
        this.events.push({ type: "boost-started" });
      }
    } else {
      const eventBonus = this.state.specialEvent === "ufo" ? 0.055 : 0;
      this.state.boostCharge = Math.min(
        1,
        this.state.boostCharge +
          (BOOST_IDLE_RECHARGE + eventBonus + this.state.drift * BOOST_DRIFT_RECHARGE) *
            dt,
      );
    }
    this.boostActive = this.state.boosting;

    const oldForwardX = -Math.sin(this.state.heading);
    const oldForwardZ = -Math.cos(this.state.heading);
    const oldForwardSpeed =
      this.state.velocity.x * oldForwardX +
      this.state.velocity.z * oldForwardZ;
    const directionSign =
      Math.abs(oldForwardSpeed) > 0.2
        ? Math.sign(oldForwardSpeed)
        : throttle < -0.05
          ? -1
          : 1;
    const speedFactor = smoothstep(velocityBefore, 0.8, 7.2);
    const turnRate =
      (this.state.vehicleMode === "car" ? CAR_TURN_RATE : BOAT_TURN_RATE) *
      (input.directional
        ? 0.62 + speedFactor * 0.65
        : 0.28 + speedFactor * 0.72);
    this.state.heading -= steering * turnRate * directionSign * dt;

    const forwardX = -Math.sin(this.state.heading);
    const forwardZ = -Math.cos(this.state.heading);
    const rightX = Math.cos(this.state.heading);
    const rightZ = -Math.sin(this.state.heading);
    let forwardSpeed =
      this.state.velocity.x * forwardX +
      this.state.velocity.z * forwardZ;
    let lateralSpeed =
      this.state.velocity.x * rightX +
      this.state.velocity.z * rightZ;
    if (input.directional) {
      const sharpTurn = smoothstep(
        1 - directionalAlignment,
        0.42,
        1.55,
      );
      forwardSpeed *= Math.exp(-sharpTurn * DIRECTIONAL_TURN_BRAKE * dt);
    }

    const acceleration =
      this.state.vehicleMode === "car" ? CAR_ACCELERATION : BOAT_ACCELERATION;
    const braking =
      throttle !== 0 && Math.sign(throttle) !== Math.sign(forwardSpeed)
        ? BRAKE_ACCELERATION
        : acceleration;
    forwardSpeed += throttle * braking * dt;
    if (Math.abs(throttle) < 0.04) {
      forwardSpeed *= Math.exp(
        -(this.state.vehicleMode === "car" ? CAR_ROLLING_DRAG : BOAT_DRAG) * dt,
      );
    }

    if (this.state.boosting) {
      forwardSpeed +=
        (forwardSpeed < -0.2 ? -1 : 1) * BOOST_ACCELERATION * dt;
    }

    const driftSteering = smoothstep(Math.abs(steering), 0.42, 0.92);
    const driftIntent =
      this.state.vehicleMode === "car"
        ? driftSteering * smoothstep(Math.abs(forwardSpeed), 2.8, 7.4)
        : 0;
    const lateralBeforeGrip = lateralSpeed;
    const grounded = this.state.airHeight < 0.04;
    const grip =
      this.state.vehicleMode === "boat"
        ? BOAT_LATERAL_GRIP
        : grounded
          ? lerp(CAR_LATERAL_GRIP, CAR_DRIFT_GRIP, driftIntent)
          : AIR_LATERAL_GRIP;
    lateralSpeed *= Math.exp(-grip * dt);

    const driftTarget =
      this.state.vehicleMode === "car"
        ? smoothstep(Math.abs(lateralBeforeGrip), 0.35, 2.6) *
          smoothstep(Math.abs(forwardSpeed), 2.4, 7.2) *
          (0.18 + driftSteering * 0.82)
        : 0;
    const driftResponse =
      1 - Math.exp(-(driftTarget > this.state.drift ? 8 : 10) * dt);
    this.state.drift +=
      (driftTarget - this.state.drift) * driftResponse;
    this.updateDrift(dt, this.state.drift);

    const holdingCourse =
      throttle > 0.72 &&
      Math.abs(steering) < 0.14 &&
      this.state.drift < 0.12 &&
      grounded;
    const flowTarget = holdingCourse ? 1 : 0;
    const flowResponse =
      1 -
      Math.exp(
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

    const normalLimit =
      this.state.vehicleMode === "car" ? CAR_TOP_SPEED : BOAT_TOP_SPEED;
    const flowLimit =
      normalLimit * (1 + this.state.cruiseFlow * CRUISE_SPEED_BONUS);
    const boostLimit = this.state.boosting
      ? flowLimit * BOOST_SPEED_MULTIPLIER
      : flowLimit;
    const airLimit = this.state.airHeight > 0.02 ? boostLimit * 1.08 : boostLimit;
    forwardSpeed = clamp(forwardSpeed, -REVERSE_TOP_SPEED, airLimit);
    this.state.velocity.x =
      forwardX * forwardSpeed + rightX * lateralSpeed;
    this.state.velocity.z =
      forwardZ * forwardSpeed + rightZ * lateralSpeed;

    this.state.position.x += this.state.velocity.x * dt;
    this.state.position.z += this.state.velocity.z * dt;
    this.updateAir(dt);

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

    this.updateArcadeCollisions();
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
    this.state.drift = 0;
    this.state.boostCharge = 0.42;
    this.state.boosting = false;
    this.state.airHeight = 0;
    this.state.verticalVelocity = 0;
    this.state.airTime = 0;
    this.state.combo = 0;
    this.state.comboTimer = 0;
    this.state.lastComboAward = 0;
    this.state.arcadeScore = 0;
    this.state.specialEvent = undefined;
    this.state.specialEventRemaining = 0;
    this.state.destroyedArcadeObjects.clear();
    this.cruiseFlowActive = false;
    this.cruiseFlowCueCooldown = 0;
    this.driftActive = false;
    this.driftSeconds = 0;
    this.boostActive = false;
    this.activeRampId = undefined;
    this.nearMissedArcadeObjects.clear();
    this.waterReboundCooldown = 0;
    this.nextSpecialEventAt = this.state.elapsed + SPECIAL_EVENT_FIRST_SECONDS;

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
    this.state.airHeight = 0;
    this.state.verticalVelocity = 0;
    this.state.airTime = 0;
    this.state.drift = 0;
    this.state.boosting = false;
    this.cruiseFlowActive = false;
    this.activeRampId = undefined;
    this.updateLocation();
    this.updateNearestPhotoSpot();
  }

  consumeEvents(): GameEvent[] {
    return this.events.splice(0);
  }

  private updateCombo(dt: number): void {
    if (this.state.comboTimer <= 0) {
      return;
    }
    this.state.comboTimer = Math.max(0, this.state.comboTimer - dt);
    if (this.state.comboTimer === 0 && this.state.combo > 1) {
      this.events.push({ type: "combo-ended", combo: this.state.combo });
      this.state.combo = 0;
      this.state.lastComboAward = 0;
    }
  }

  private updateSpecialEvent(dt: number): void {
    if (this.state.specialEvent === "ufo") {
      this.state.specialEventRemaining = Math.max(
        0,
        this.state.specialEventRemaining - dt,
      );
      if (this.state.specialEventRemaining === 0) {
        this.state.specialEvent = undefined;
        this.nextSpecialEventAt =
          this.state.elapsed + SPECIAL_EVENT_INTERVAL_SECONDS;
        this.events.push({ type: "special-event-ended", event: "ufo" });
      }
      return;
    }

    if (this.state.elapsed >= this.nextSpecialEventAt) {
      this.state.specialEvent = "ufo";
      this.state.specialEventRemaining = SPECIAL_EVENT_DURATION_SECONDS;
      this.events.push({ type: "special-event-started", event: "ufo" });
    }
  }

  private updateDrift(dt: number, drift: number): void {
    if (drift >= DRIFT_START_THRESHOLD) {
      this.driftActive = true;
      this.driftSeconds += dt;
      return;
    }
    if (!this.driftActive || drift > DRIFT_END_THRESHOLD) {
      return;
    }

    if (this.driftSeconds >= DRIFT_SCORE_MIN_SECONDS) {
      const rawPoints = Math.round(80 + this.driftSeconds * 110);
      const award = this.awardCombo(rawPoints);
      this.events.push({
        type: "drift-completed",
        seconds: this.driftSeconds,
        ...award,
      });
    }
    this.driftActive = false;
    this.driftSeconds = 0;
  }

  private updateAir(dt: number): void {
    if (this.state.airHeight <= 0 && this.state.verticalVelocity <= 0) {
      this.state.airHeight = 0;
      this.state.verticalVelocity = 0;
      return;
    }

    this.state.airHeight += this.state.verticalVelocity * dt;
    this.state.verticalVelocity -= ARCADE_GRAVITY * dt;
    this.state.airTime += dt;
    if (this.state.airHeight > 0) {
      return;
    }

    const completedAirTime = this.state.airTime;
    this.state.airHeight = 0;
    this.state.verticalVelocity = 0;
    this.state.airTime = 0;
    if (completedAirTime >= LANDING_SCORE_MIN_SECONDS) {
      const rawPoints = Math.round(120 + completedAirTime * 170);
      const award = this.awardCombo(rawPoints);
      this.events.push({
        type: "jump-landed",
        seconds: completedAirTime,
        ...award,
      });
    }
  }

  private updateArcadeCollisions(): void {
    const { position, airHeight } = this.state;
    const speed = Math.hypot(this.state.velocity.x, this.state.velocity.z);

    if (this.activeRampId) {
      const activeRamp = ARCADE_COURSE_OBJECTS.find(
        (object) => object.id === this.activeRampId,
      );
      if (
        !activeRamp ||
        Math.hypot(activeRamp.x - position.x, activeRamp.z - position.z) >
          activeRamp.radius + 1.3
      ) {
        this.activeRampId = undefined;
      }
    }

    for (const object of ARCADE_COURSE_OBJECTS) {
      const distance = Math.hypot(
        object.x - position.x,
        object.z - position.z,
      );

      if (object.kind === "ramp") {
        if (
          distance < object.radius &&
          airHeight < 0.06 &&
          speed >= RAMP_MIN_SPEED &&
          this.activeRampId !== object.id
        ) {
          this.activeRampId = object.id;
          this.state.airHeight = 0.04;
          this.state.verticalVelocity =
            RAMP_VERTICAL_VELOCITY + Math.min(1.2, speed * 0.08);
          this.state.airTime = 0;
          this.state.velocity.x *= 1.12;
          this.state.velocity.z *= 1.12;
          this.events.push({ type: "ramp-launched", ramp: object });
        }
        continue;
      }

      if (this.state.destroyedArcadeObjects.has(object.id)) {
        continue;
      }

      const vehicleCenterY = airHeight + 0.58;
      const verticalDistance = Math.abs(vehicleCenterY - object.y);
      if (
        distance < object.radius &&
        verticalDistance < (object.kind === "balloon" ? 0.9 : 0.72)
      ) {
        this.state.destroyedArcadeObjects.add(object.id);
        const award = this.awardCombo(object.points);
        const inverseSpeed = speed > 0.01 ? 1 / speed : 0;
        this.events.push({
          type: "arcade-hit",
          object,
          ...award,
          impulse: {
            x: this.state.velocity.x * inverseSpeed * (4.2 + speed * 0.2),
            z: this.state.velocity.z * inverseSpeed * (4.2 + speed * 0.2),
          },
        });
        this.state.boostCharge = Math.min(
          1,
          this.state.boostCharge + SMASH_BOOST_REWARD,
        );
        continue;
      }

      if (
        object.kind !== "balloon" &&
        speed >= NEAR_MISS_MIN_SPEED &&
        distance >= object.radius &&
        distance < object.radius + NEAR_MISS_BAND &&
        !this.nearMissedArcadeObjects.has(object.id)
      ) {
        this.nearMissedArcadeObjects.add(object.id);
        const award = this.awardCombo(75);
        this.events.push({
          type: "arcade-near-miss",
          object,
          ...award,
        });
      }
    }
  }

  private awardCombo(rawPoints: number): { points: number; combo: number } {
    this.state.combo = Math.min(MAX_COMBO, Math.max(1, this.state.combo + 1));
    this.state.comboTimer = COMBO_SECONDS;
    const eventMultiplier = this.state.specialEvent === "ufo" ? 2 : 1;
    const points = rawPoints * this.state.combo * eventMultiplier;
    this.state.lastComboAward = points;
    this.state.arcadeScore += points;
    return { points, combo: this.state.combo };
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
      const speed = Math.hypot(this.state.velocity.x, this.state.velocity.z);
      if (
        nextMode === "boat" &&
        speed >= WATER_REBOUND_MIN_SPEED &&
        this.waterReboundCooldown === 0
      ) {
        this.waterReboundCooldown = WATER_REBOUND_COOLDOWN_SECONDS;
        this.state.airHeight = Math.max(0.04, this.state.airHeight);
        this.state.verticalVelocity = Math.max(
          this.state.verticalVelocity,
          WATER_REBOUND_VELOCITY,
        );
        this.state.airTime = 0;
        const award = this.awardCombo(140);
        this.events.push({ type: "water-rebound", ...award });
      }
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

      if (distance < LANDMARK_INTERACT_RADIUS && distance < nearestDistance) {
        nearest = spot;
        nearestDistance = distance;
      }
    }

    this.state.nearestPhotoSpot = nearest;

    // Playtests showed players driving straight past landmarks: the on-screen
    // prompt existed, but nothing ever required them to stop, so most sessions
    // ended without the core loop happening even once. Arriving now collects
    // the postcard by itself, the same way roadside specialties already work.
    //
    // Memorial sites are deliberately excluded. They use a quiet, deliberate
    // visit flow, and auto-collecting one while driving past would turn a
    // place of remembrance into incidental loot.
    if (
      nearest &&
      nearest.visitMode !== "reflection" &&
      !this.state.collectedPostcards.has(nearest.id)
    ) {
      this.state.collectedPostcards.add(nearest.id);
      this.events.push({
        type: "postcard-collected",
        spot: nearest,
        firstCollection: true,
        automatic: true,
      });
    }
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

/**
 * Arcade driving needs the player to deliberately cut close to a landmark.
 * Keeping this below the playground ramp distance prevents a large pickup
 * radius from collecting several nearby European landmarks during one pass.
 */
const LANDMARK_INTERACT_RADIUS = 2.2;

const SPECIALTY_DISCOVERY_RADIUS = 1.9;

const CAR_ACCELERATION = 9.8;
const BOAT_ACCELERATION = 5.8;
const BRAKE_ACCELERATION = 14;
const BOOST_ACCELERATION = 12.5;
const CAR_TOP_SPEED = 8.4;
const BOAT_TOP_SPEED = 6.6;
const REVERSE_TOP_SPEED = 4.2;
const CAR_TURN_RATE = 2.25;
const BOAT_TURN_RATE = 1.55;
const CAR_ROLLING_DRAG = 1.35;
const BOAT_DRAG = 1.05;
const CAR_LATERAL_GRIP = 7.8;
const CAR_DRIFT_GRIP = 0.85;
const BOAT_LATERAL_GRIP = 4;
const AIR_LATERAL_GRIP = 0.24;
const DIRECTIONAL_FULL_STEER_ANGLE = Math.PI * 0.38;
const DIRECTIONAL_TURN_BRAKE = 3.8;
const DRIFT_START_THRESHOLD = 0.14;
const DRIFT_END_THRESHOLD = 0.07;
const DRIFT_SCORE_MIN_SECONDS = 0.16;
const BOOST_DRAIN_RATE = 0.26;
const BOOST_IDLE_RECHARGE = 0.018;
const BOOST_DRIFT_RECHARGE = 0.24;
const BOOST_SPEED_MULTIPLIER = 1.62;
const SMASH_BOOST_REWARD = 0.075;
const RAMP_MIN_SPEED = 3.2;
const RAMP_VERTICAL_VELOCITY = 5.2;
const ARCADE_GRAVITY = 10.8;
const LANDING_SCORE_MIN_SECONDS = 0.38;
const NEAR_MISS_MIN_SPEED = 5.8;
const NEAR_MISS_BAND = 0.62;
const COMBO_SECONDS = 3.8;
const MAX_COMBO = 12;
const WATER_REBOUND_MIN_SPEED = 4.2;
const WATER_REBOUND_VELOCITY = 4.1;
const WATER_REBOUND_COOLDOWN_SECONDS = 2.5;
const SPECIAL_EVENT_FIRST_SECONDS = 24;
const SPECIAL_EVENT_DURATION_SECONDS = 12;
const SPECIAL_EVENT_INTERVAL_SECONDS = 34;

/**
 * Cruise flow rewards a clean line while the new drift meter rewards breaking
 * that line on purpose. The two systems create an immediately readable rhythm:
 * build speed, throw the car sideways, then spend the earned boost.
 */
const CRUISE_BUILD_RATE = 1.7;
const CRUISE_BREAK_RATE = 5.2;
const CRUISE_SPEED_BONUS = 0.22;
const CRUISE_CUE_THRESHOLD = 0.82;
const CRUISE_REARM_THRESHOLD = 0.42;
const CRUISE_CUE_COOLDOWN_SECONDS = 7;
const MODE_TRANSITION_SECONDS = 0.82;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number, minimum: number, maximum: number): number {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

export function getCurrentGeoPosition(state: GameState): readonly [number, number] {
  return worldToGeo(state.position.x, state.position.z);
}
