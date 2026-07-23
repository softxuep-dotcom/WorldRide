import type { MovementInput } from "./simulation";

export class InputController {
  readonly movement: MovementInput = { x: 0, z: 0 };
  private readonly pressedKeys = new Set<string>();
  private joystickPointerId?: number;
  private joystickVector = { x: 0, z: 0 };
  private interactRequested = false;

  constructor(
    private readonly joystick: HTMLElement,
    private readonly joystickKnob: HTMLElement,
  ) {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);

    joystick.addEventListener("pointerdown", this.onJoystickDown);
    joystick.addEventListener("pointermove", this.onJoystickMove);
    joystick.addEventListener("pointerup", this.onJoystickUp);
    joystick.addEventListener("pointercancel", this.onJoystickUp);
  }

  update(): MovementInput {
    const keyboardX =
      Number(this.pressedKeys.has("ArrowRight") || this.pressedKeys.has("KeyD")) -
      Number(this.pressedKeys.has("ArrowLeft") || this.pressedKeys.has("KeyA"));
    const keyboardZ =
      Number(this.pressedKeys.has("ArrowDown") || this.pressedKeys.has("KeyS")) -
      Number(this.pressedKeys.has("ArrowUp") || this.pressedKeys.has("KeyW"));

    this.movement.x = keyboardX || this.joystickVector.x;
    this.movement.z = keyboardZ || this.joystickVector.z;
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
    this.resetJoystick();
  };

  private readonly onJoystickDown = (event: PointerEvent): void => {
    this.joystickPointerId = event.pointerId;
    this.joystick.setPointerCapture(event.pointerId);
    this.updateJoystick(event);
  };

  private readonly onJoystickMove = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) {
      return;
    }
    this.updateJoystick(event);
  };

  private readonly onJoystickUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.joystickPointerId) {
      return;
    }
    this.resetJoystick();
  };

  private updateJoystick(event: PointerEvent): void {
    const bounds = this.joystick.getBoundingClientRect();
    const radius = bounds.width * 0.31;
    const rawX = event.clientX - (bounds.left + bounds.width / 2);
    const rawY = event.clientY - (bounds.top + bounds.height / 2);
    const length = Math.hypot(rawX, rawY);
    const scale = length > radius ? radius / length : 1;
    const x = rawX * scale;
    const y = rawY * scale;

    this.joystickVector.x = x / radius;
    this.joystickVector.z = y / radius;
    this.joystickKnob.style.transform = `translate(${x}px, ${y}px)`;
  }

  private resetJoystick(): void {
    this.joystickPointerId = undefined;
    this.joystickVector.x = 0;
    this.joystickVector.z = 0;
    this.joystickKnob.style.transform = "translate(0, 0)";
  }
}
