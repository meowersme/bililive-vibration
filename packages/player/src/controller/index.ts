import { VibrationData } from 'bililive-vibration-parser';

import { EE } from '../bus';
import { Vibrator } from './vibrator';

export class VibrationController {
  private videoElement: HTMLVideoElement | null = null;

  private vibrationDataStore: VibrationData[] = [];

  private rafId: number | null = null;

  private lastPlayedData: VibrationData | null = null;

  public vibrator: Vibrator;

  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.vibrator = new Vibrator();
    this.onAnimationFrame(0);
  }

  public addVibrationData(data: VibrationData) {
    this.vibrationDataStore.push(data);
  }

  public clearVibrationData() {
    this.vibrationDataStore = [];
  }

  private popVibrationData(currentTime: number) {
    if (!this.vibrationDataStore.length) {
      return;
    }

    let index = 0;
    let abs = Math.abs(this.vibrationDataStore[0]!.timestamp - currentTime);

    for (let i = 1; i < this.vibrationDataStore.length; i++) {
      const data = this.vibrationDataStore[i];
      if (!data) {
        continue;
      }

      const newAbs = Math.abs(data.timestamp - currentTime);
      if (newAbs <= abs) {
        index = i;
        abs = newAbs;
      }
    }

    const data = this.vibrationDataStore[index];
    // this.vibrationDataStore.splice(0, index);
    return data;
  }

  private playing = false;

  private onUpdateVibrate() {
    const video = this.videoElement;
    if (!video || video.paused || video.ended) {
      if (this.playing) {
        this.vibrator.setState(0, 0);
      }

      this.playing = false;
      return;
    }

    this.playing = true;

    const currentTime = video.currentTime;
    const duration = video.duration;
    EE.emit('VIDEO_TIME_UPDATE', currentTime, duration);
    console.log('Current Time', currentTime);

    if (this.lastPlayedData && currentTime - this.lastPlayedData.timestamp > 1) {
      // this.webXInputSetState(0, 0)
      this.vibrator.setState(0, 0);
    }

    const data = this.popVibrationData(currentTime);
    if (!data || !data.vibrate || data === this.lastPlayedData) {
      // console.log("No Vibration Data", data, this.lastPlayedData);
      return;
    }

    console.log('Vibration Data', data);
    const diff = data.timestamp - currentTime;

    if (Math.abs(diff) <= 1) {
      const delay = Math.max(0, diff);
      setTimeout(() => {
        // this.webXInputSetState(data.vibrate.l, data.vibrate.r)
        this.vibrator.setState(data.vibrate.l, data.vibrate.r);
      }, delay * 1000);
      this.lastPlayedData = data;
    } else {
      console.warn('Vibration data is too far', diff);
    }
  }

  private onAnimationFrame(ts: number) {
    if (performance.now() - ts < 5) {
      this.onUpdateVibrate();
    } else {
      // console.warn('Frame drop', performance.now() - ts);
    }

    this.rafId = requestAnimationFrame(this.onAnimationFrame.bind(this));
  }

  public destroy() {
    this.videoElement = null;
    this.vibrationDataStore = [];
    this.vibrator.destroy();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}
