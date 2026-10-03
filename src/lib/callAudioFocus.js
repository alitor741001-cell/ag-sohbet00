let claimed = false;
const listeners = new Set();
export const hasDirectCallAudioFocus = () => claimed;
export function subscribeCallAudioFocus(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export async function claimCallAudioFocus() {
  if (claimed) return;
  claimed = true;
  // Release room capture before acquiring the call microphone: two simultaneous
  // getUserMedia streams can silence each other on iOS.
  await Promise.all([...listeners].map((listener) => listener(true)));
}
export function releaseCallAudioFocus() {
  if (!claimed) return;
  claimed = false;
  listeners.forEach((listener) => listener(false));
}