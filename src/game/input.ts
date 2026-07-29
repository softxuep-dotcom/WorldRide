import type { MovementInput } from "./simulation";

export class InputController {
  readonly movement: MovementInput = { x: 0, z: 0 };
  private enabled = true;
  private readonly pressedKeys = new Set<string>();
  private dragPointerId?: number;
  private dragOrigin = { x: 0, y: 0 };
  private dragVector = { x: 0, z: 0 };
  private dragTarget = { x: 0, z: 0 };
  private dragUsesScreenDirection = false;
  private interactRequested = false;
  private readonly boostPointerIds = new Set<number>();
  private readonly boostButton?: HTMLButtonElement;
  private readonly touchSteering?: HTMLElement;
  private readonly touchSteeringKnob?: HTMLElement;
  private touchSteeringHideTimer?: number;

  constructor(private readonly surface: HTMLElement) {
    const boostButton = document.getElementById("boost-button");
    this.boostButton =
      boostButton instanceof HTMLButtonElement ? boostButton : undefined;
    this.touchSteering =
      document.getElementById("touch-steering") ?? undefined;
    this.touchSteeringKnob =
      document.getElementById("touch-steering-knob") ?? undefined;
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    surface.addEventListener("pointerdown", this.onDragStart);
    surface.addEventListener("pointermove", this.onDragMove);
    surface.addEventListener("pointerup", this.onDragEnd);
    surface.addEventListener("pointercancel", this.onDragEnd);
    surface.addEventListener("lostpointercapture", this.onDragEnd);
    this.boostButton?.addEventListener("pointerdown", this.onBoostStart);
    this.boostButton?.addEventListener("pointerup", this.onBoostEnd);
    this.boostButton?.addEventListener("pointercancel", this.onBoostEnd);
    this.boostButton?.addEventListener("lostpointercapture", this.onBoostEnd);
  }

  update(): MovementInput {
    if (!this.enabled) {
      this.movement.x = 0;
      this.movement.z = 0;
      this.movement.boost = false;
      this.movement.directional = false;
      return this.movement;
    }
    const keyboardX =
      Number(this.pressedKeys.has("ArrowRight") || this.pressedKeys.has("KeyD")) -
      Number(this.pressedKeys.has("ArrowLeft") || this.pressedKeys.has("KeyA"));
    const keyboardZ =
      Number(this.pressedKeys.has("ArrowDown") || this.pressedKeys.has("KeyS")) -
      Number(this.pressedKeys.has("ArrowUp") || this.pressedKeys.has("KeyW"));

    if (this.dragPointerId !== undefined) {
      this.dragVector.x += (this.dragTarget.x - this.dragVector.x) * 0.24;
      this.dragVector.z += (this.dragTarget.z - this.dragVector.z) * 0.34;
    }
    this.movement.x = keyboardX || this.dragVector.x;
    this.movement.z = keyboardZ || this.dragVector.z;
    this.movement.directional =
      keyboardX === 0 &&
      keyboardZ === 0 &&
      this.dragPointerId !== undefined &&
      this.dragUsesScreenDirection;
    this.movement.boost =
      this.pressedKeys.has("Space") ||
      this.pressedKeys.has("ShiftLeft") ||
      this.boostPointerIds.size > 0;
    return this.movement;
  }

  consumeInteractRequest(): boolean {
    if (!this.enabled) {
      return false;
    }
    const requested = this.interactRequested;
    this.interactRequested = false;
    return requested;
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.surface.removeEventListener("pointerdown", this.onDragStart);
    this.surface.removeEventListener("pointermove", this.onDragMove);
    this.surface.removeEventListener("pointerup", this.onDragEnd);
    this.surface.removeEventListener("pointercancel", this.onDragEnd);
    this.surface.removeEventListener("lostpointercapture", this.onDragEnd);
    this.boostButton?.removeEventListener("pointerdown", this.onBoostStart);
    this.boostButton?.removeEventListener("pointerup", this.onBoostEnd);
    this.boostButton?.removeEventListener("pointercancel", this.onBoostEnd);
    this.boostButton?.removeEventListener("lostpointercapture", this.onBoostEnd);
  }

  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) {
      return;
    }
    this.enabled = enabled;
    if (!enabled) {
      this.pressedKeys.clear();
      this.interactRequested = false;
      this.boostPointerIds.clear();
      this.resetDrag();
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "ShiftLeft", "KeyW", "KeyA", "KeyS", "KeyD"].includes(
        event.code,
      )
    ) {
      event.preventDefault();
    }

    if (!this.enabled) {
      return;
    }
    this.pressedKeys.add(event.code);
    if (event.code === "KeyE") {
      this.interactRequested = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedKeys.clear();
    this.boostPointerIds.clear();
    this.resetDrag();
  };

  private readonly onBoostStart = (event: PointerEvent): void => {
    if (!this.enabled || !event.isPrimary) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.boostPointerIds.add(event.pointerId);
    this.boostButton?.setPointerCapture(event.pointerId);
  };

  private readonly onBoostEnd = (event: PointerEvent): void => {
    if (!this.boostPointerIds.has(event.pointerId)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.boostPointerIds.delete(event.pointerId);
  };

  private readonly onDragStart = (event: PointerEvent): void => {
    if (
      !this.enabled ||
      this.dragPointerId !== undefined ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    event.preventDefault();
    this.dragPointerId = event.pointerId;
    this.dragUsesScreenDirection =
      event.pointerType !== "mouse" || window.innerWidth <= 760;
    this.dragOrigin.x = event.clientX;
    this.dragOrigin.y = event.clientY;
    try {
      this.surface.setPointerCapture(event.pointerId);
    } catch {
      // Some embedded mobile browsers can end a pointer before capture lands.
      // Directional steering still works and pointerup/cancel will reset it.
    }
    this.dragVector.x = 0;
    this.dragVector.z = 0;
    this.dragTarget.x = 0;
    this.dragTarget.z = 0;
    this.showTouchSteering(event);
  };

  private readonly onDragMove = (event: PointerEvent): void => {
    if (!this.enabled || event.pointerId !== this.dragPointerId) {
      return;
    }

    event.preventDefault();
    this.updateDrag(event);
  };

  private readonly onDragEnd = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragPointerId) {
      return;
    }

    this.resetDrag();
  };

  private updateDrag(event: PointerEvent): void {
    const deadZone = 7;
    const fullDistance = 62;
    const rawX = event.clientX - this.dragOrigin.x;
    const rawY = event.clientY - this.dragOrigin.y;

    if (this.dragUsesScreenDirection) {
      const length = Math.hypot(rawX, rawY);
      const strength =
        length <= deadZone
          ? 0
          : Math.min(1, (length - deadZone) / (fullDistance - deadZone)) ** 0.9;
      this.dragTarget.x = length > 0 ? (rawX / length) * strength : 0;
      this.dragTarget.z = length > 0 ? (rawY / length) * strength : 0;
      this.updateTouchSteeringKnob(rawX, rawY);
      return;
    }

    this.dragTarget.x = this.mapDragAxis(rawX, deadZone, 68, 1.35);
    this.dragTarget.z = this.mapDragAxis(rawY, deadZone, 50, 0.9);
  }

  private mapDragAxis(
    value: number,
    deadZone: number,
    fullDistance: number,
    responseCurve: number,
  ): number {
    const magnitude = Math.abs(value);
    if (magnitude <= deadZone) {
      return 0;
    }
    const normalized = Math.min(
      1,
      (magnitude - deadZone) / (fullDistance - deadZone),
    );
    return Math.sign(value) * normalized ** responseCurve;
  }

  private resetDrag(): void {
    if (
      this.dragPointerId !== undefined &&
      this.surface.hasPointerCapture(this.dragPointerId)
    ) {
      this.surface.releasePointerCapture(this.dragPointerId);
    }
    this.dragPointerId = undefined;
    this.dragUsesScreenDirection = false;
    this.dragVector.x = 0;
    this.dragVector.z = 0;
    this.dragTarget.x = 0;
    this.dragTarget.z = 0;
    this.hideTouchSteering();
  }

  private showTouchSteering(event: PointerEvent): void {
    if (!this.dragUsesScreenDirection || !this.touchSteering) {
      return;
    }
    const radius = 50;
    const x = Math.min(window.innerWidth - radius, Math.max(radius, event.clientX));
    const y = Math.min(window.innerHeight - radius, Math.max(radius, event.clientY));
    this.touchSteering.style.left = `${x}px`;
    this.touchSteering.style.top = `${y}px`;
    window.clearTimeout(this.touchSteeringHideTimer);
    this.touchSteering.classList.remove("is-releasing");
    this.touchSteering.classList.add("is-active");
    this.touchSteering.dataset.x = "0.00";
    this.touchSteering.dataset.z = "0.00";
    this.updateTouchSteeringKnob(0, 0);
  }

  private updateTouchSteeringKnob(rawX: number, rawY: number): void {
    if (!this.touchSteering || !this.touchSteeringKnob) {
      return;
    }
    const maxKnobTravel = 31;
    const length = Math.hypot(rawX, rawY);
    const scale = length > maxKnobTravel ? maxKnobTravel / length : 1;
    const knobX = rawX * scale;
    const knobY = rawY * scale;
    this.touchSteeringKnob.style.transform =
      `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    this.touchSteering.dataset.x = this.dragTarget.x.toFixed(2);
    this.touchSteering.dataset.z = this.dragTarget.z.toFixed(2);
  }

  private hideTouchSteering(): void {
    if (!this.touchSteering) {
      return;
    }
    this.touchSteering.classList.add("is-releasing");
    window.clearTimeout(this.touchSteeringHideTimer);
    this.touchSteeringHideTimer = window.setTimeout(() => {
      this.touchSteering?.classList.remove("is-active", "is-releasing");
    }, 140);
  }
}
