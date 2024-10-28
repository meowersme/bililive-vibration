import EventEmitter from 'eventemitter3';

export const EE = new EventEmitter<{
  VIDEO_TIME_UPDATE: [number, number];
  GAMEPAD_UPDATE: [Gamepad[]];
  USER_INTERACTION: [];
}>();

let userGesture = false;

const onUserGesture = () => {
  userGesture = true;
  window.removeEventListener('touchstart', onUserGesture);
  window.removeEventListener('click', onUserGesture);
  EE.emit('USER_INTERACTION');
};

window.addEventListener('touchstart', onUserGesture);
window.addEventListener('click', onUserGesture);

export function userInteractionDetected() {
  return userGesture;
}
