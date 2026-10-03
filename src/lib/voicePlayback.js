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
  let level = 1;

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

  const applyLevel = () => {
    if (gain) gain.gain.value = muted ? 0 : level;
    element.volume = level;
    element.muted = useWebAudio ? true : muted;
  };

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
      applyLevel();
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
      applyLevel();
    },
    /** Hoparlör açıkken tam ses; kapalıyken çıkış ahize seviyesine (kulağa) alınır. */
    async setSpeaker(on) {
      level = on ? 1 : 0.35;
      applyLevel();
      if (typeof element.setSinkId !== 'function' || !navigator.mediaDevices?.enumerateDevices) return;
      try {
        const outputs = (await navigator.mediaDevices.enumerateDevices())
          .filter((device) => device.kind === 'audiooutput');
        const target = on
          ? outputs.find((device) => /speaker|hoparl/i.test(device.label))
          : outputs.find((device) => /earpiece|receiver|handset|ahize|communications|kulakl/i.test(device.label));
        if (target) await element.setSinkId(target.deviceId);
      } catch {}
    },
  };
}

let activeRingtone = null;

/** Çalan telefon sesi — birebir arama zilini üretir ve durdurma fonksiyonu döner. */
export function startRingtone({ freq = 880, interval = 2000 } = {}) {
  activeRingtone?.();
  const context = getContext();
  if (!context) return () => {};
  let stopped = false;
  let timer = null;

  const beep = (offset) => {
    if (stopped) return;
    const startAt = context.currentTime + offset;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.4);
    osc.connect(gain).connect(context.destination);
    osc.start(startAt);
    osc.stop(startAt + 0.45);
  };

  const pattern = () => {
    if (stopped) return;
    context.resume?.().catch(() => {});
    beep(0);
    beep(0.5);
    if (navigator.vibrate) navigator.vibrate([320, 160, 320]);
  };

  pattern();
  timer = setInterval(pattern, interval);

  const stop = () => {
    stopped = true;
    clearInterval(timer);
    if (navigator.vibrate) navigator.vibrate(0);
    if (activeRingtone === stop) activeRingtone = null;
  };
  activeRingtone = stop;
  return stop;
}

if (typeof window !== 'undefined') {
  const unlock = () => { unlockVoicePlayback().catch(() => {}); };
  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('touchend', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true });
}