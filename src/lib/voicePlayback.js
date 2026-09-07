let audioContext = null;

function getContext() {
  if (audioContext) return audioContext;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  audioContext = new AudioContext();
  return audioContext;
}

export async function unlockVoicePlayback() {
  const context = getContext();
  if (!context) throw new Error('Ses çıkışı desteklenmiyor.');
  if (context.state === 'suspended') await context.resume();
  if (context.state !== 'running') throw new Error('Ses çıkışı kullanıcı etkileşimi bekliyor.');
  return true;
}

export function createVoiceOutput(track, roomId) {
  const element = track.attach();
  element.autoplay = true;
  element.playsInline = true;
  element.style.display = 'none';
  element.dataset.livekitVoice = roomId;
  element.dataset.livekitTrack = track.sid;
  document.body.appendChild(element);
  return element;
}

if (typeof window !== 'undefined') {
  const unlock = () => { unlockVoicePlayback().catch(() => {}); };
  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('touchend', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true });
}