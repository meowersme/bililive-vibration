import { EE, userInteractionDetected } from '../bus';

const browserVibrateProxy = (value: number) => {
  navigator.vibrate(value);
};

/**
 * 震动器基类。
 */
export abstract class Vibrator {
  protected timerId: number | null = null;

  protected enabled = false;

  public setState(l: number, r: number) {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    if (!this.enabled) {
      return;
    }

    this.vibrate(l, r);

    if (l > 0 || r > 0) {
      this.timerId = window.setTimeout(() => {
        this.timerId = null;
        this.setState(0, 0);
      }, 1000);
    }
  }

  protected abstract vibrate(l: number, r: number): void;
  public destroy() {}
}

/**
 * 手柄震动器。
 */
export class GamepadVibrator extends Vibrator {
  private gamepads: Gamepad[] = [];

  private onGamepadConnected: (e: GamepadEvent) => void;
  private onGamepadDisconnected: (e: GamepadEvent) => void;

  constructor() {
    super();

    this.enabled = !!(
      window.Gamepad &&
      window.GamepadHapticActuator &&
      window.GamepadHapticActuator.prototype.playEffect
    );

    this.onGamepadConnected = (e: GamepadEvent) => {
      console.log('A gamepad was connected:' + e.gamepad.id);
      this.refreshGamepads();
    };

    this.onGamepadDisconnected = (e: GamepadEvent) => {
      console.log('A gamepad was disconnected:' + e.gamepad.id);
      this.refreshGamepads();
    };

    window.addEventListener('gamepadconnected', this.onGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }

  public refreshGamepads() {
    this.gamepads = navigator.getGamepads().filter((gamepad) => gamepad !== null);
    EE.emit('GAMEPAD_UPDATE', this.gamepads);
  }

  protected vibrate(l: number, r: number) {
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

  public destroy() {
    window.removeEventListener('gamepadconnected', this.onGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.onGamepadDisconnected);
  }
}

/**
 * 手机浏览器震动器。
 */
export class MobileVibrator extends Vibrator {
  private lastValue = 0;
  private motorPercent = 0;
  private vibrating = false;

  constructor() {
    super();
    this.enabled = typeof window.navigator.vibrate === 'function';
  }

  protected vibrate(l: number, r: number) {
    const value = Math.max(l, r * 0.5);

    if (value !== this.lastValue) {
      this.lastValue = value;
      this.motorPercent = value / 65535;

      if (!userInteractionDetected()) {
        return;
      }

      if (value > 0) {
        if (!this.vibrating) {
          this.vibrating = true;
          this.run();
        }
      } else {
        this.vibrating = false;
        browserVibrateProxy(0);
      }
    }
  }

  private run() {
    if (!this.lastValue || this.lastValue < 0 || !this.vibrating) {
      return;
    }

    // 浏览器震动 API 不支持控制强弱，只能通过频率来模拟
    if (this.motorPercent < 0.075) {
      const i = 100 - (this.motorPercent / 0.025) * 100;
      browserVibrateProxy(2);
      setTimeout(() => {
        this.run();
      }, i);
    } else if (this.motorPercent < 0.88) {
      const i = 50 * this.motorPercent;
      browserVibrateProxy(i);
      setTimeout(() => {
        this.run();
      }, i);
    } else {
      const i = 100 * this.motorPercent;
      browserVibrateProxy(i);
      setTimeout(() => {
        this.run();
      }, i);
    }
  }
}
