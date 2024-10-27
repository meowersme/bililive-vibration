import { EE } from '../bus';

let S = false;
const x = () => {
  S = true;
  window.removeEventListener('touchstart', x);
  window.removeEventListener('click', x);
};

window.addEventListener('touchstart', x);
window.addEventListener('click', x);

export class Vibrator {
  private isControllerHapticEnabled = true;

  private gamepads: Gamepad[] = [];

  private onGamepadConnected: (e: GamepadEvent) => void;
  private onGamepadDisconnected: (e: GamepadEvent) => void;

  constructor() {
    this.onGamepadConnected = (e: GamepadEvent) => {
      console.log('A gamepad was connected:' + e.gamepad.id);
      this.refreshGamepads();
    };

    this.onGamepadDisconnected = (e: GamepadEvent) => {
      console.log('A gamepad was disconnected:' + e.gamepad.id);
      this.refreshGamepads();
    };

    this.isControllerHapticEnabled = this.isSupportControllerHaptic();

    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  public refreshGamepads() {
    this.gamepads = navigator.getGamepads().filter((gamepad) => gamepad !== null);
    EE.emit('GAMEPAD_UPDATE', this.gamepads);
  }

  private timerId: number | null = null;

  public setState(l: number, r: number) {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    console.log('Vibrate', l, r);
    this.vibrateViaNavigator(l, r);
    this.vibrateViaGamepad(l, r);

    if (l > 0 || r > 0) {
      this.timerId = window.setTimeout(() => {
        this.timerId = null;
        this.setState(0, 0);
      }, 1000);
    }
  }

  private lastValue = 0;
  private motorPercent = 0;

  public getMotorPercent() {
    return this.motorPercent;
  }

  private n = false;

  public vibrateViaNavigator(l: number, r: number) {
    if (!this.isSupportWebHaptic()) {
      return;
    }

    const i = 0.5;
    const o = 65535;
    const a = Math.max(l, r * i);

    if (a !== this.lastValue) {
      this.lastValue = a;
      this.motorPercent = a / o;

      if (!S) {
        return;
      }

      if (a > 0) {
        if (!this.n) {
          this.n = true;
          // window.navigator.vibrate(a);
          this.doNavigatorVibrate();
        }
      } else {
        this.n = false;
        window.navigator.vibrate(0);
      }
    }
  }

  private doNavigatorVibrate() {
    if (S && this.lastValue > 0 && this.n) {
      if (this.motorPercent < 0.075) {
        // C(e, w, "f").call(e, e, this.motorPercent)
        const i = 100 - (this.motorPercent / 0.025) * 100;
        window.navigator.vibrate(2);
        setTimeout(() => {
          // C(e, v, "f").call(e, e);
          this.doNavigatorVibrate();
        }, i);
      } else if (this.motorPercent < 0.88) {
        // C(e, y, "f").call(e, e, this.motorPercent)
        const i = 50 * this.motorPercent;
        window.navigator.vibrate(i);
        setTimeout(() => {
          // C(e, v, "f").call(e, e);
          this.doNavigatorVibrate();
        }, i);
      } else {
        // C(e, g, "f").call(e, e, this.motorPercent))
        const i = 100 * this.motorPercent;
        window.navigator.vibrate(i);
        setTimeout(() => {
          // C(e, v, "f").call(e, e);
          this.doNavigatorVibrate();
        }, i);
      }
    }
  }

  public vibrateViaGamepad(l: number, r: number) {
    if (!this.isControllerHapticEnabled) {
      return;
    }

    for (const [, gamepad] of Object.entries(this.gamepads)) {
      if (gamepad?.vibrationActuator?.playEffect) {
        gamepad.vibrationActuator.playEffect('dual-rumble', {
          duration: 1000,
          strongMagnitude: l / 65535,
          weakMagnitude: r / 65535,
        });
      }
    }
  }

  public isSupportWebHaptic() {
    return !!window.navigator.vibrate;
  }

  // https://issues.chromium.org/issues/40250856
  public isSupportControllerHaptic() {
    return !!(
      window.Gamepad &&
      window.GamepadHapticActuator &&
      window.GamepadHapticActuator.prototype.playEffect
    );
  }

  public isSupport() {
    return this.isSupportControllerHaptic() || this.isSupportWebHaptic();
  }

  public enableControllerHaptic() {
    this.isControllerHapticEnabled = true;
  }

  public disableControllerHaptic() {
    this.isControllerHapticEnabled = false;
  }

  public destroy() {
    this.isControllerHapticEnabled = false;
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }
}
