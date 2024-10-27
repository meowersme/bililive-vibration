import EventEmitter from 'eventemitter3';

export const EE = new EventEmitter<{
  VIDEO_TIME_UPDATE: [number, number];
  GAMEPAD_UPDATE: [Gamepad[]];
}>();
