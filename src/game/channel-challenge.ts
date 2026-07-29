export type ChannelRoute = "sky" | "cargo" | "wave";
export type ChannelChallengePhase = "approach" | "route";

export interface ChannelChallengeState {
  active: boolean;
  completed: boolean;
  phase: ChannelChallengePhase;
  route?: ChannelRoute;
  elapsed: number;
  remaining: number;
  progress: number;
  checkpoints: number;
}

export const CHANNEL_CHALLENGE_DURATION = 20;
export const CHANNEL_CHOICE_SECONDS = 3.6;
export const CHANNEL_START = Object.freeze({ x: 0, z: -150 });
export const CHANNEL_GATE_Z = -171;
export const CHANNEL_FINISH_Z = -292;
export const CHANNEL_HALF_WIDTH = 5.7;
export const CHANNEL_ROUTE_HALF_WIDTH = 1.55;

export const CHANNEL_ROUTE_LANES: Readonly<Record<ChannelRoute, number>> = {
  sky: -3.6,
  cargo: 0,
  wave: 3.6,
};

export const CHANNEL_ROUTE_ORDER: readonly ChannelRoute[] = [
  "sky",
  "cargo",
  "wave",
];

export const CHANNEL_CHECKPOINT_PROGRESS = [
  0.42,
  0.56,
  0.7,
  0.84,
] as const;

export function createChannelChallengeState(): ChannelChallengeState {
  return {
    active: false,
    completed: false,
    phase: "approach",
    route: undefined,
    elapsed: 0,
    remaining: 0,
    progress: 0,
    checkpoints: 0,
  };
}

export function nearestChannelRoute(x: number): ChannelRoute {
  let nearest = CHANNEL_ROUTE_ORDER[0];
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const route of CHANNEL_ROUTE_ORDER) {
    const distance = Math.abs(x - CHANNEL_ROUTE_LANES[route]);
    if (distance < nearestDistance) {
      nearest = route;
      nearestDistance = distance;
    }
  }
  return nearest;
}
