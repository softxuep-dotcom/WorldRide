import type { GameEvent, GameState } from "./simulation";

export class ArcadeHUD {
  private readonly root = requireElement("arcade-hud");
  private readonly score = requireElement("arcade-score");
  private readonly durability = requireElement("arcade-durability");
  private readonly combo = requireElement("arcade-combo");
  private readonly comboLabel = requireElement("arcade-combo-label");
  private readonly boostFill = requireElement("boost-meter-fill");
  private readonly boostButton = requireElement("boost-button");
  private readonly eventBanner = requireElement("arcade-event");
  private readonly eventTitle = requireElement("arcade-event-title");
  private readonly eventTimer = requireElement("arcade-event-timer");
  private comboPulseTimer?: number;
  private impactTimer?: number;
  private durabilityTimer?: number;

  update(state: GameState): void {
    this.root.dataset.speed = Math.hypot(
      state.velocity.x,
      state.velocity.z,
    ).toFixed(2);
    this.root.dataset.drift = state.drift.toFixed(2);
    this.root.dataset.airHeight = state.airHeight.toFixed(2);
    this.root.dataset.boosting = String(state.boosting);
    this.root.dataset.destroyed = String(state.destroyedArcadeObjects.size);
    this.root.dataset.health = String(state.health);
    this.root.dataset.heading = state.heading.toFixed(3);
    this.root.dataset.velocityX = state.velocity.x.toFixed(2);
    this.root.dataset.velocityZ = state.velocity.z.toFixed(2);
    this.score.textContent = Math.round(state.arcadeScore).toLocaleString();
    this.durability.textContent =
      `${"♥".repeat(state.health)}${"♡".repeat(3 - state.health)}`;
    this.combo.textContent = `×${Math.max(1, state.combo)}`;
    this.combo.classList.toggle("is-active", state.combo > 1);
    this.comboLabel.textContent =
      state.combo > 1
        ? `+${state.lastComboAward}`
        : state.destroyedArcadeObjects.size === 0
          ? "↑  🛫"
          : state.destroyedArcadeObjects.size < 3
            ? `💥 ${state.destroyedArcadeObjects.size}/3`
            : "⚡ · 🛫";
    this.boostFill.style.setProperty(
      "--boost",
      `${Math.round(state.boostCharge * 100)}%`,
    );
    this.boostButton.classList.toggle("is-ready", state.boostCharge >= 0.18);
    this.boostButton.classList.toggle("is-firing", state.boosting);

    const eventActive = state.specialEvent === "ufo";
    this.eventBanner.classList.toggle("is-visible", eventActive);
    this.eventBanner.setAttribute("aria-hidden", String(!eventActive));
    if (eventActive) {
      this.eventTitle.textContent = "🛸 ×2";
      this.eventTimer.textContent = `${Math.ceil(state.specialEventRemaining)}s`;
    }
  }

  handleEvent(event: GameEvent): void {
    switch (event.type) {
      case "arcade-hit":
        this.flashImpact();
        this.pulseCombo();
        break;
      case "trap-hit":
        this.flashImpact();
        this.durability.classList.remove("is-hit");
        void this.durability.offsetWidth;
        this.durability.classList.add("is-hit");
        window.clearTimeout(this.durabilityTimer);
        this.durabilityTimer = window.setTimeout(
          () => this.durability.classList.remove("is-hit"),
          420,
        );
        break;
      case "arcade-near-miss":
      case "jump-landed":
      case "drift-completed":
      case "water-rebound":
        this.pulseCombo();
        break;
      case "special-event-started":
        this.eventTitle.textContent = "🛸 ×2";
        this.eventBanner.classList.add("is-visible");
        break;
      case "special-event-ended":
        this.eventBanner.classList.remove("is-visible");
        break;
      default:
        break;
    }
  }

  private pulseCombo(): void {
    this.combo.classList.remove("is-popping");
    void this.combo.offsetWidth;
    this.combo.classList.add("is-popping");
    window.clearTimeout(this.comboPulseTimer);
    this.comboPulseTimer = window.setTimeout(
      () => this.combo.classList.remove("is-popping"),
      280,
    );
  }

  private flashImpact(): void {
    this.root.classList.remove("is-impact");
    void this.root.offsetWidth;
    this.root.classList.add("is-impact");
    window.clearTimeout(this.impactTimer);
    this.impactTimer = window.setTimeout(
      () => this.root.classList.remove("is-impact"),
      260,
    );
  }
}

function requireElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing #${id}`);
  }
  return element;
}
