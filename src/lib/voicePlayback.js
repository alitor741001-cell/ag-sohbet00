let audioContext = null;

function getContext() {
  if (audioContext) return audioContext;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  try {
    audioContext = new AudioContext();
    return audioContext;
  } catch {
    return null;
  }
}

export async function unlockVoicePlayback() {
  const context = getContext();
  // Web Audio bulunmayan cihazlarda yerel <audio> oynatımı kullanılabilir.
  if (!context) return true;
  if (context.state === 'suspended') await context.resume();
  if (context.state !== 'running') throw new Error('Ses çıkışı kullanıcı etkileşimi bekliyor.');
  return true;
}

export function createVoiceOutput(track, roomId) {
  const context = getContext();
  const mediaTrack = track.mediaStreamTrack;
  const element = track.attach();
  element.autoplay = true;
  element.playsInline = true;
  element.style.display = 'none';
  document.body.appendChild(element);

  let source = null;
  let gain = null;
  let useWebAudio = false;
  let muted = false;

  if (context && mediaTrack) {
    try {
      source = context.createMediaStreamSource(new MediaStream([mediaTrack]));
      gain = context.createGain();
      source.connect(gain).connect(context.destination);
      useWebAudio = true;
      element.muted = true;
    } catch {
      useWebAudio = false;
    }
  }

  return {
    dataset: { livekitVoice: roomId, livekitTrack: track.sid, livekitMediaTrack: mediaTrack?.id || '' },
    async play() {
      if (useWebAudio) {
        try {
          await unlockVoicePlayback();
          element.muted = true;
          element.play().catch(() => {});
          return;
        } catch {
          source?.disconnect();
          gain?.disconnect();
          source = null;
          gain = null;
          useWebAudio = false;
        }
      }
      element.muted = muted;
      await element.play();
    },
    remove() {
      source?.disconnect();
      gain?.disconnect();
      track.detach(element);
      element.remove();
    },
    get muted() { return muted; },
    set muted(value) {
      muted = value;
      if (gain) gain.gain.value = value ? 0 : 1;
      element.muted = useWebAudio ? true : value;
    },
  };
}

if (typeof window !== 'undefined') {
  const unlock = () => { unlockVoicePlayback().catch(() => {}); };
  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('touchend', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true });
}