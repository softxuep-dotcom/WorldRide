import type { MovementInput } from "./simulation";

export class InputController {
  readonly movement: MovementInput = { x: 0, z: 0 };
  private readonly pressedKeys = new Set<string>();
  private dragPointerId?: number;
  private dragOrigin = { x: 0, y: 0 };
  private dragVector = { x: 0, z: 0 };
  private interactRequested = false;

  constructor(private readonly surface: HTMLElement) {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    surface.addEventListener("pointerdown", this.onDragStart);
    surface.addEventListener("pointermove", this.onDragMove);
    surface.addEventListener("pointerup", this.onDragEnd);
    surface.addEventListener("pointercancel", this.onDragEnd);
    surface.addEventListener("lostpointercapture", this.onDragEnd);
  }

  update(): MovementInput {
    const keyboardX =
      Number(this.pressedKeys.has("ArrowRight") || this.pressedKeys.has("KeyD")) -
      Number(this.pressedKeys.has("ArrowLeft") || this.pressedKeys.has("KeyA"));
    const keyboardZ =
      Number(this.pressedKeys.has("ArrowDown") || this.pressedKeys.has("KeyS")) -
      Number(this.pressedKeys.has("ArrowUp") || this.pressedKeys.has("KeyW"));

    this.movement.x = keyboardX || this.dragVector.x;
    this.movement.z = keyboardZ || this.dragVector.z;
    return this.movement;
  }

  consumeInteractRequest(): boolean {
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
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(
        event.code,
      )
    ) {
      event.preventDefault();
    }

    this.pressedKeys.add(event.code);
    if (event.code === "Space" || event.code === "KeyE") {
      this.interactRequested = true;
    }
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    this.pressedKeys.delete(event.code);
  };

  private readonly onBlur = (): void => {
    this.pressedKeys.clear();
    this.resetDrag();
  };

  private readonly onDragStart = (event: PointerEvent): void => {
    if (
      this.dragPointerId !== undefined ||
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    event.preventDefault();
    this.dragPointerId = event.pointerId;
    this.dragOrigin.x = event.clientX;
    this.dragOrigin.y = event.clientY;
    this.surface.setPointerCapture(event.pointerId);
    this.dragVector.x = 0;
    this.dragVector.z = 0;
  };

  private readonly onDragMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragPointerId) {
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
    const deadZone = 6;
    const fullSpeedDistance = 72;
    const rawX = event.clientX - this.dragOrigin.x;
    const rawY = event.clientY - this.dragOrigin.y;
    const length = Math.hypot(rawX, rawY);

    if (length <= deadZone) {
      this.dragVector.x = 0;
      this.dragVector.z = 0;
      return;
    }

    const strength = Math.min(
      1,
      (length - deadZone) / (fullSpeedDistance - deadZone),
    );
    this.dragVector.x = (rawX / length) * strength;
    this.dragVector.z = (rawY / length) * strength;
  }

  private resetDrag(): void {
    if (
      this.dragPointerId !== undefined &&
      this.surface.hasPointerCapture(this.dragPointerId)
    ) {
      this.surface.releasePointerCapture(this.dragPointerId);
    }
    this.dragPointerId = undefined;
    this.dragVector.x = 0;
    this.dragVector.z = 0;
  }
}
