/** Android capture can report live before the hardware produces audio. */
export default function waitForAudioTrack(track, timeout = 4000) {
  if (track.readyState !== 'live') return Promise.reject(new Error('Mikrofon kapandı.'));
  if (!track.muted) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const finish = (error) => {
      clearTimeout(timer);
      track.removeEventListener('unmute', ready);
      track.removeEventListener('ended', ended);
      if (error) reject(error); else resolve();
    };
    const ready = () => { if (!track.muted) finish(); };
    const ended = () => finish(new Error('Mikrofon kapandı.'));
    const timer = setTimeout(() => finish(Object.assign(new Error('Mikrofon ses üretmedi.'), { name: 'NotReadableError', code: 'mic_muted' })), timeout);
    track.addEventListener('unmute', ready);
    track.addEventListener('ended', ended);
    ready();
  });
}