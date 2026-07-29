import type { GameState, VehicleMode } from "./simulation";

/**
 * Fully synthesised audio. Every sound is generated with Web Audio oscillators
 * and noise buffers, so the game ships no audio files: zero bytes, zero
 * licensing, nothing fetched at runtime.
 *
 * A single AudioContext, created lazily on the first user gesture (browsers
 * block audio before that). A continuous engine/motor drone tracks speed and
 * car/boat mode; discrete cues fire from game events.
 */
const STORAGE_KEY = "pocket-earth:muted";

export class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private muted = readMutedPreference();

  // Continuous engine layer.
  private engineOsc?: OscillatorNode;
  private engineSubOsc?: OscillatorNode;
  private engineGain?: GainNode;
  private engineFilter?: BiquadFilterNode;
  private waterNoiseGain?: GainNode;

  /** Called from the first pointer/key gesture to satisfy autoplay policy. */
  unlock(): void {
    if (this.muted) {
      return;
    }
    this.ensureContext();
    if (this.context?.state === "suspended") {
      void this.context.resume();
    }
  }

  get isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    writeMutedPreference(muted);
    if (muted) {
      this.suspend();
    } else {
      this.ensureContext();
      void this.context?.resume();
    }
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Pauses all sound without discarding the graph (tab hidden, ad break). */
  suspend(): void {
    if (this.context?.state === "running") {
      void this.context.suspend();
    }
  }

  resume(): void {
    if (this.muted) {
      return;
    }
    if (this.context?.state === "suspended") {
      void this.context.resume();
    }
  }

  /** Drives the continuous engine/motor drone from the live state. */
  updateDrive(state: GameState): void {
    if (this.muted || !this.context || !this.engineGain) {
      return;
    }

    const speed = Math.hypot(state.velocity.x, state.velocity.z);
    const normalized = Math.min(1, speed / 11.5);
    const now = this.context.currentTime;

    // Pitch and loudness rise with speed. The car sits lower in the mix than
    // the boat so its continuous engine does not mask discovery cues.
    const basePitch = state.vehicleMode === "car" ? 62 : 40;
    const pitchSpan = state.vehicleMode === "car" ? 74 : 40;
    this.engineOsc?.frequency.setTargetAtTime(
      basePitch + normalized * pitchSpan + (state.boosting ? 42 : 0),
      now,
      0.08,
    );
    this.engineSubOsc?.frequency.setTargetAtTime(
      (basePitch + normalized * pitchSpan + (state.boosting ? 42 : 0)) * 0.5,
      now,
      0.08,
    );
    const driveGain =
      state.vehicleMode === "car"
        ? 0.025 + normalized * 0.075 + (state.boosting ? 0.035 : 0)
        : 0.05 + normalized * 0.14;
    this.engineGain.gain.setTargetAtTime(driveGain, now, 0.1);
    this.engineFilter?.frequency.setTargetAtTime(
      380 + normalized * 900,
      now,
      0.1,
    );

    // Boat mode adds a water-rush noise bed that fades in with the mode blend.
    if (this.waterNoiseGain) {
      const target = state.vehicleMode === "boat" ? 0.03 + normalized * 0.06 : 0;
      this.waterNoiseGain.gain.setTargetAtTime(target, now, 0.2);
    }
  }

  onModeChanged(mode: VehicleMode): void {
    if (mode === "boat") {
      this.playSplash();
    } else {
      this.playClack();
    }
  }

  /**
   * A brief wind lift confirms that holding a clean line has reached cruising
   * flow. It stays lighter than discovery and milestone cues because it can
   * recur during ordinary driving.
   */
  onCruiseFlow(): void {
    this.playNoiseBurst(0.2, 2200, 0.045, true);
    this.playTone(392, 0.16, "triangle", 0.045);
    window.setTimeout(
      () => this.playTone(587.33, 0.18, "sine", 0.04),
      90,
    );
  }

  onCountryEntered(firstVisit: boolean): void {
    if (firstVisit) {
      this.playArpeggio([523.25, 659.25, 783.99], 0.13, "triangle", 0.16);
    }
  }

  onPostcardCollected(firstCollection: boolean): void {
    // Short camera-shutter tick plus a bright confirmation chime.
    this.playNoiseBurst(0.05, 2600, 0.12);
    if (firstCollection) {
      this.playArpeggio([784, 1046.5], 0.1, "sine", 0.14);
    }
  }

  /** Lighter than a landmark: a soft two-note lift, not a fanfare. */
  onSpecialtyDiscovered(firstDiscovery: boolean): void {
    if (!firstDiscovery) {
      return;
    }
    this.playArpeggio([659.25, 880], 0.085, "sine", 0.1);
  }

  /**
   * Milestone fanfare: a bright ascending major arpeggio capped by a soft
   * high shimmer. Reserved for aggregate achievements, so it can sit a notch
   * above the single-collection cues without becoming a blaring jingle.
   */
  onMilestone(): void {
    this.playArpeggio([523.25, 659.25, 783.99, 1046.5], 0.12, "triangle", 0.16);
    window.setTimeout(
      () => this.playTone(1567.98, 0.5, "sine", 0.075),
      520,
    );
  }

  onMapEdge(): void {
    this.playTone(150, 0.18, "sine", 0.1);
  }

  onBoostStarted(): void {
    this.playNoiseBurst(0.22, 2800, 0.08, true);
    this.playTone(196, 0.12, "sawtooth", 0.055);
    window.setTimeout(() => this.playTone(392, 0.18, "sawtooth", 0.045), 70);
  }

  onRampLaunch(): void {
    this.playTone(330, 0.09, "square", 0.06);
    window.setTimeout(() => this.playTone(660, 0.2, "triangle", 0.055), 65);
  }

  onArcadeHit(combo: number): void {
    this.playNoiseBurst(0.085, 1800 + combo * 90, 0.12);
    this.playTone(150 + combo * 18, 0.1, "square", 0.055);
  }

  onNearMiss(): void {
    this.playNoiseBurst(0.12, 3400, 0.04, true);
    this.playTone(740, 0.1, "sine", 0.035);
  }

  onDriftCompleted(combo: number): void {
    this.playTone(260 + combo * 22, 0.11, "triangle", 0.045);
    window.setTimeout(
      () => this.playTone(390 + combo * 26, 0.13, "triangle", 0.04),
      75,
    );
  }

  onJumpLanded(combo: number): void {
    this.playNoiseBurst(0.11, 900, 0.15);
    this.playTone(110 + combo * 12, 0.16, "square", 0.07);
  }

  onWaterRebound(): void {
    this.playSplash();
    window.setTimeout(() => this.playTone(520, 0.15, "triangle", 0.05), 90);
  }

  onSpecialEvent(): void {
    this.playArpeggio([220, 329.63, 493.88, 739.99], 0.1, "sine", 0.15);
    this.playNoiseBurst(0.32, 3600, 0.05, true);
  }

  private ensureContext(): void {
    if (this.context) {
      return;
    }
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) {
      return;
    }

    const context = new Ctor();
    const master = context.createGain();
    master.gain.value = 0.9;
    master.connect(context.destination);

    this.context = context;
    this.master = master;
    this.buildEngine();
  }

  private buildEngine(): void {
    if (!this.context || !this.master) {
      return;
    }
    const ctx = this.context;

    const engineGain = ctx.createGain();
    engineGain.gain.value = 0.025;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    engineGain.connect(filter);
    filter.connect(this.master);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 62;
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 31;
    osc.connect(engineGain);
    sub.connect(engineGain);
    osc.start();
    sub.start();

    // Water bed: filtered looping noise, silent until boat mode.
    const waterGain = ctx.createGain();
    waterGain.gain.value = 0;
    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = "bandpass";
    waterFilter.frequency.value = 900;
    waterFilter.Q.value = 0.6;
    const waterNoise = ctx.createBufferSource();
    waterNoise.buffer = this.createNoiseBuffer(2);
    waterNoise.loop = true;
    waterNoise.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(this.master);
    waterNoise.start();

    this.engineOsc = osc;
    this.engineSubOsc = sub;
    this.engineGain = engineGain;
    this.engineFilter = filter;
    this.waterNoiseGain = waterGain;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (this.muted || !this.context || !this.master) {
      return;
    }
    const ctx = this.context;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playArpeggio(
    frequencies: readonly number[],
    step: number,
    type: OscillatorType,
    peak: number,
  ): void {
    if (this.muted || !this.context || !this.master) {
      return;
    }
    const ctx = this.context;
    frequencies.forEach((frequency, index) => {
      const start = ctx.currentTime + index * step;
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + step + 0.12);
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start(start);
      osc.stop(start + step + 0.16);
    });
  }

  private playClack(): void {
    // Two quick woody ticks: tyres dropping back down.
    this.playTone(320, 0.06, "square", 0.09);
    window.setTimeout(() => this.playTone(220, 0.07, "square", 0.08), 70);
  }

  private playSplash(): void {
    this.playNoiseBurst(0.28, 1400, 0.16, true);
    this.playTone(180, 0.12, "sine", 0.06);
    window.setTimeout(
      () => this.playNoiseBurst(0.14, 2400, 0.07, true),
      90,
    );
  }

  private playNoiseBurst(
    duration: number,
    filterFrequency: number,
    peak: number,
    sweepDown = false,
  ): void {
    if (this.muted || !this.context || !this.master) {
      return;
    }
    const ctx = this.context;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = this.createNoiseBuffer(duration + 0.05);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFrequency, now);
    if (sweepDown) {
      filter.frequency.exponentialRampToValueAtTime(400, now + duration);
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
    source.stop(now + duration + 0.05);
  }

  private createNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.context!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

function readMutedPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMutedPreference(muted: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    // Preference is best-effort; ignore storage failures.
  }
}
