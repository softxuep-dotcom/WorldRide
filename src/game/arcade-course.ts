import { PHOTO_SPOTS, geoToWorld, type PhotoSpotId } from "./data";

export type ArcadeObjectKind =
  | "ramp"
  | "crate"
  | "barrier"
  | "balloon"
  | "trap";

export interface ArcadeCourseObject {
  id: string;
  kind: ArcadeObjectKind;
  x: number;
  z: number;
  y: number;
  heading: number;
  radius: number;
  points: number;
}

interface PlaygroundDefinition {
  spot: PhotoSpotId;
  heading: number;
}

/**
 * Each playground starts just outside a landmark pickup radius. A ramp sits
 * directly on the exit line, with smashable props arranged through the jump.
 * Reusing the same small grammar around several famous landmarks makes the
 * entire map feel more playful without shipping a new asset pack.
 */
const PLAYGROUNDS: PlaygroundDefinition[] = [
  { spot: "eiffel-tower", heading: Math.PI / 4 },
  { spot: "big-ben", heading: -Math.PI / 3 },
  { spot: "giza-pyramids", heading: Math.PI * 0.72 },
  { spot: "statue-of-liberty", heading: -Math.PI * 0.7 },
  { spot: "fuji-view", heading: Math.PI * 0.18 },
  { spot: "sydney-opera-house", heading: Math.PI * 1.12 },
];

export const ARCADE_COURSE_OBJECTS: readonly ArcadeCourseObject[] =
  PLAYGROUNDS.flatMap(createPlayground);

function createPlayground(
  playground: PlaygroundDefinition,
): ArcadeCourseObject[] {
  const spot = PHOTO_SPOTS.find((candidate) => candidate.id === playground.spot);
  if (!spot) {
    return [];
  }

  const anchor = geoToWorld(spot.point);
  const forwardX = -Math.sin(playground.heading);
  const forwardZ = -Math.cos(playground.heading);
  const sideX = Math.cos(playground.heading);
  const sideZ = -Math.sin(playground.heading);
  const at = (
    id: string,
    kind: ArcadeObjectKind,
    forward: number,
    side: number,
    y: number,
    radius: number,
    points: number,
  ): ArcadeCourseObject => ({
    id: `${playground.spot}-${id}`,
    kind,
    x: anchor.x + forwardX * forward + sideX * side,
    z: anchor.z + forwardZ * forward + sideZ * side,
    y,
    heading: playground.heading,
    radius,
    points,
  });

  return [
    at("ramp", "ramp", 2.65, 0, 0, 1.08, 0),
    at("crate-left", "crate", 4.5, -0.68, 0.42, 0.68, 120),
    at("crate-right", "crate", 4.5, 0.68, 0.42, 0.68, 120),
    at("balloon", "balloon", 5.8, 0, 1.65, 0.64, 260),
    at("trap", "trap", 6.2, 0, 0.08, 0.74, 0),
    at("barrier-left", "barrier", 7.1, -1.02, 0.38, 0.64, 160),
    at("barrier-right", "barrier", 7.1, 1.02, 0.38, 0.64, 160),
    at("crate-finish", "crate", 8.4, 0, 0.42, 0.68, 180),
  ];
}
