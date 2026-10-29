// Mobil sürücüler canlı kanalı ilk anda muted olarak döndürebilir.
// Kanalı hemen kapatmak yerine aygıtın unmute olayını bekle.
export default function waitForMicReady(track, timeout = 8000) {
  return new Promise((resolve, reject) => {
    let timer;
    const finish = (error) => {
      clearTimeout(timer);
      track?.removeEventListener?.('unmute', check);
      track?.removeEventListener?.('ended', check);
      if (error) reject(error); else resolve(track);
    };
    const check = () => {
      if (!track || track.readyState !== 'live') {
        finish(Object.assign(new Error('Mikrofon kanalı kapandı.'), { name: 'NotReadableError' }));
      } else if (!track.muted) finish();
    };
    track?.addEventListener?.('unmute', check);
    track?.addEventListener?.('ended', check);
    timer = setTimeout(() => finish(Object.assign(new Error('Mikrofon aygıtı sessiz kaldı.'), { name: 'NotReadableError' })), timeout);
    if (track) track.enabled = true;
    check();
  });
}