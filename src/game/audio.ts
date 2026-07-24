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
    const normalized = Math.min(1, speed / 6);
    const now = this.context.currentTime;

    // Pitch and loudness rise with speed; idle stays quiet but audible.
    const basePitch = state.vehicleMode === "car" ? 62 : 40;
    const pitchSpan = state.vehicleMode === "car" ? 74 : 40;
    this.engineOsc?.frequency.setTargetAtTime(
      basePitch + normalized * pitchSpan,
      now,
      0.08,
    );
    this.engineSubOsc?.frequency.setTargetAtTime(
      (basePitch + normalized * pitchSpan) * 0.5,
      now,
      0.08,
    );
    this.engineGain.gain.setTargetAtTime(0.05 + normalized * 0.14, now, 0.1);
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

  onMapEdge(): void {
    this.playTone(150, 0.18, "sine", 0.1);
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
    engineGain.gain.value = 0.05;
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
