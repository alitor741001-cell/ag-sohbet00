import { useEffect, useRef, useState } from 'react';
import { FastForward, Maximize, Minimize, Pause, Play, Rewind } from 'lucide-react';

// YouTube IFrame API'si tek seferde yüklenir ve tüm oda aynı oynatıcıyı kullanır.
let apiPromise = null;
const loadYouTubeApi = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { previous?.(); resolve(window.YT); };
      if (!document.querySelector('script[data-youtube-api]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.setAttribute('data-youtube-api', 'true');
        document.head.appendChild(script);
      }
    });
  }
  return apiPromise;
};

const fmt = (seconds) => {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
};

/**
 * YouTube videosunu oda ekranında oynatır: ilerleme, geri/ileri sarma ve tam ekran
 * mevcut film oynatıcısıyla aynı şekilde odaya senkron bildirilir.
 */
export default function YouTubeStage({ videoId, syncState, isOwner, isTimeSource, onPlayPause, onTimeUpdate, onSeek, onEnded, fullscreenRef, suppressControls = false }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const lastReportRef = useRef(0);
  const syncRef = useRef(syncState);
  const ownerRef = useRef(isOwner);
  syncRef.current = syncState;
  ownerRef.current = isOwner;

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState('');

  // Video değişince oynatıcı yeniden kurulur ve odanın konumundan başlar.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current?.destroy?.();
      hostRef.current.innerHTML = '';
      const mount = document.createElement('div');
      hostRef.current.appendChild(mount);
      playerRef.current = new YT.Player(mount, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0 },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setReady(true);
            setDuration(event.target.getDuration?.() || 0);
            const target = syncRef.current?.current_time || 0;
            if (target > 1) event.target.seekTo(target, true);
            if (syncRef.current?.is_playing) event.target.playVideo();
          },
          onError: () => setError('Bu video oynatılamıyor. Başka bir YouTube linki dene.'),
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (event.data === state?.PLAYING) {
              setPlaying(true);
              if (ownerRef.current) onPlayPause?.(true);
            } else if (event.data === state?.PAUSED) {
              setPlaying(false);
              if (ownerRef.current) onPlayPause?.(false);
            } else if (event.data === state?.ENDED) {
              setPlaying(false);
              onEnded?.();
            }
          },
        },
      });
    });
    return () => { cancelled = true; playerRef.current?.destroy?.(); playerRef.current = null; };
  }, [videoId]);

  useEffect(() => {
    if (suppressControls) setShowControls(false);
  }, [suppressControls]);

  // İlerleme göstergesi + sahibin odaya konum bildirmesi.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;
      setCurrent(player.getCurrentTime() || 0);
      setDuration(player.getDuration?.() || 0);
      const state = window.YT?.PlayerState;
      if (isTimeSource && onTimeUpdate && player.getPlayerState?.() === state?.PLAYING && Date.now() - lastReportRef.current > 2000) {
        lastReportRef.current = Date.now();
        onTimeUpdate(player.getCurrentTime());
      }
    }, 1000);
    return () => clearInterval(id);
  }, [ready, isTimeSource, onTimeUpdate]);

  // Odadan gelen konuma göre hizalanır (oda sahibi zaman kaynağıdır).
  useEffect(() => {
    if (!ready || isTimeSource) return;
    const player = playerRef.current;
    if (!player?.getCurrentTime) return;
    const state = window.YT?.PlayerState;
    const target = syncState?.current_time || 0;
    if (Math.abs((player.getCurrentTime() || 0) - target) > 3) player.seekTo(target, true);
    if (syncState?.is_playing && player.getPlayerState?.() !== state?.PLAYING) player.playVideo();
    if (!syncState?.is_playing && player.getPlayerState?.() === state?.PLAYING) player.pauseVideo();
  }, [ready, isTimeSource, syncState?.current_time, syncState?.is_playing, syncState?.last_sync]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const togglePlay = () => {
    if (!isOwner) return;
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo?.();
    else player.playVideo?.();
  };

  const skip = (delta) => {
    if (!isOwner) return;
    const player = playerRef.current;
    if (!player?.getCurrentTime) return;
    const target = Math.max(0, player.getCurrentTime() + delta);
    player.seekTo(target, true);
    onSeek?.(target);
  };

  const moveBar = (event) => {
    if (!isOwner) return;
    const player = playerRef.current;
    const total = player?.getDuration?.() || duration;
    if (!total) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const target = ((event.clientX - rect.left) / rect.width) * total;
    player.seekTo(target, true);
    onSeek?.(target);
  };

  const toggleFullscreen = () => {
    const el = fullscreenRef?.current || containerRef.current;
    let operation;
    if (!document.fullscreenElement) {
      if (el?.requestFullscreen) operation = el.requestFullscreen();
      else if (el?.webkitRequestFullscreen) operation = el.webkitRequestFullscreen();
    } else {
      operation = document.exitFullscreen?.();
    }
    operation?.catch?.((err) => { if (err?.name !== 'AbortError') console.error('[YouTube] Tam ekran başarısız', err); });
  };

  const showCtrl = () => {
    if (suppressControls) return;
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 4000);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black select-none"
      onMouseMove={showCtrl}
      onClick={() => {
        showCtrl();
        if (!playing && syncState?.is_playing) playerRef.current?.playVideo?.();
      }}
      style={{ touchAction: isOwner ? 'manipulation' : 'none' }}
    >
      <div ref={hostRef} className="h-full w-full" />

      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-amber-300">{error}</div>}

      <div
        className={`pointer-events-auto absolute inset-x-0 bottom-0 z-[60] bg-gradient-to-t from-black/90 to-transparent p-3 transition-opacity sm:p-4 ${(suppressControls || !showControls) ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-white">
          {isOwner && <span>{fmt(current)}</span>}
          {isOwner && (
            <div className="relative h-1.5 flex-1 cursor-pointer rounded-full bg-white/30" onClick={moveBar}>
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${duration ? (current / duration) * 100 : 0}%` }} />
              <div className="absolute top-1/2 -ml-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-primary" style={{ left: `${duration ? (current / duration) * 100 : 0}%` }} />
            </div>
          )}
          {isOwner && <span>{fmt(duration)}</span>}
        </div>
        <div className="flex items-center gap-1 text-white sm:gap-2">
          {isOwner && <button onClick={togglePlay} className="rounded-lg p-2 hover:bg-white/10">{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>}
          {isOwner && <button onClick={() => skip(-10)} className="rounded-lg p-2 hover:bg-white/10" title="10 sn geri"><Rewind className="h-5 w-5" /></button>}
          {isOwner && <button onClick={() => skip(10)} className="rounded-lg p-2 hover:bg-white/10" title="10 sn ileri"><FastForward className="h-5 w-5" /></button>}
          <button onClick={toggleFullscreen} className="ml-auto rounded-lg p-2 hover:bg-white/10" title="Tam ekran">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}