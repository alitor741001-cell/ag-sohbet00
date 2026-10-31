import { useEffect, useRef, useState } from 'react';
import { Captions, CaptionsOff, FastForward, Maximize, Minimize, Pause, Play, Rewind, Volume2, VolumeX } from 'lucide-react';
import VolumeSlider from './VolumeSlider';

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

// Gömülü YouTube oynatıcısının ses seviyesi iOS/iPadOS'ta programatik olarak değiştirilemez:
// WebKit sesi telefonun kendi ayarına bırakır, yalnızca sessize alma çalışır.
const IOS_VOLUME_LOCKED = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// İzleyicide film kendi akışında oynar: oda ile aradaki küçük fark düzeltilmez.
// Yalnızca belirgin sapmada hizalanır, böylece film durup baştan sarmaz.
const SYNC_TOLERANCE = 6;


/**
 * YouTube videosunu oda ekranında oynatır: ilerleme, geri/ileri sarma ve tam ekran
 * mevcut film oynatıcısıyla aynı şekilde odaya senkron bildirilir.
 */
export default function YouTubeStage({ videoId, syncState, isOwner, isTimeSource, onPlayPause, onTimeUpdate, onSeek, onEnded, fullscreenRef, suppressControls = false, onControlsChange, revealSignal }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimer = useRef(null);
  const lastReportRef = useRef(0);
  const syncRef = useRef(syncState);
  const ownerRef = useRef(isOwner);
  // Odaya yalnızca zaman kaynağı yazar: izleyicinin oynatıcısındaki anlık durum
  // değişimleri (otomatik başlatma, tampon) odayı duraklatmaz.
  const sourceRef = useRef(isTimeSource);
  syncRef.current = syncState;
  ownerRef.current = isOwner;
  sourceRef.current = isTimeSource;

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [error, setError] = useState('');
  // Film sesi: herkes kendi cihazında kısıp açabilir, odaya yazılmaz. Ayar, doğrudan
  // oynatıcıdaki (useMediaVolume) altyapının kullandığı anahtarlarla cihazda saklanır.
  const [volume, setVolume] = useState(() => {
    const stored = Number(localStorage.getItem('filmkeyfi_player_volume') ?? 1);
    return Number.isFinite(stored) ? Math.round(Math.min(1, Math.max(0, stored)) * 100) : 100;
  });
  const [muted, setMuted] = useState(() => localStorage.getItem('filmkeyfi_player_muted') === 'true');
  // Film altyazısı: YouTube'un kendi CC düğmesi gizli (controls: 0) olduğu için
  // kapatma/açma kontrolü oynatıcının içinde durur ve cihazda hatırlanır.
  const [captions, setCaptions] = useState(() => localStorage.getItem('filmkeyfi_captions') === 'true');
  const captionsRef = useRef(captions);
  captionsRef.current = captions;
  // Tarayıcı sesli otomatik başlatmayı engellerse film sessiz başlatılır; görüntü
  // karşı tarafta da oynar, ses kişi ekrana ilk dokunduğunda geri açılır.
  const mutedForAutoplayRef = useRef(false);
  // Ses, otomatik başlatma için kısıldıysa uyarı görünür: tek dokunuşla ses açılır.
  const [autoplayMuted, setAutoplayMuted] = useState(false);
  // Odadan gelen son konum: alındığı an saklanır, beklenen konum bu andan hesaplanır.
  const baselineRef = useRef({ time: 0, playing: false, at: 0 });
  // Hizalama sonrası kısa bekleme: art arda sarma/durdurma komutu verilmez.
  const seekGuardRef = useRef(0);
  const playNudgeRef = useRef(0);
  // Duraklatma bildirimi geciktirilir: anlık duraklama tüm odayı durdurmaz.
  const pauseTimerRef = useRef(null);

  // Sessize alma yalnızca açık kullanıcı tercihiyle uygulanır, yüzde eşiği yoktur.
  const silent = muted;

  // Ses, kaydırma sırasında anında uygulanır: React güncellemesi beklenmez.
  const applyVolume = (level, isMuted) => {
    const player = playerRef.current;
    if (!player?.setVolume) return;
    if (isMuted) player.mute?.(); else player.unMute?.();
    if (!IOS_VOLUME_LOCKED) player.setVolume(isMuted ? 0 : level);
  };

  const changeVolume = (percent) => {
    const level = Math.round(Math.min(100, Math.max(0, Number(percent) || 0)));
    mutedForAutoplayRef.current = false;
    setVolume(level);
    setMuted(level === 0);
    localStorage.setItem('filmkeyfi_player_volume', String(level / 100));
    localStorage.setItem('filmkeyfi_player_muted', String(level === 0));
    applyVolume(level, level === 0);
  };

  const toggleMute = () => {
    const next = !silent;
    const level = !next && volume === 0 ? 100 : volume;
    mutedForAutoplayRef.current = false;
    setMuted(next);
    if (level !== volume) setVolume(level);
    localStorage.setItem('filmkeyfi_player_muted', String(next));
    localStorage.setItem('filmkeyfi_player_volume', String(level / 100));
    applyVolume(level, next);
  };

  // Altyazı, boş parça verilerek kapatılır (YouTube'un "parça yok" durumu).
  // Açılırken filmin parça listesinden Türkçe ya da varsayılan parça seçilir.
  const applyCaptions = (on) => {
    const player = playerRef.current;
    if (!player?.setOption) return;
    player.loadModule?.('captions');
    if (!on) {
      player.setOption('captions', 'track', {});
      return;
    }
    const tracks = player.getOption?.('captions', 'tracklist') || [];
    const track = tracks.find((item) => item?.is_default)
      || tracks.find((item) => /^tr/i.test(item?.languageCode || ''))
      || tracks[0];
    player.setOption('captions', 'track', { languageCode: track?.languageCode || 'tr' });
  };

  const toggleCaptions = () => {
    const next = !captions;
    setCaptions(next);
    localStorage.setItem('filmkeyfi_captions', String(next));
    applyCaptions(next);
  };

  // Sessiz otomatik başlatma kullanıldıysa ses, kişi ekrana ilk dokunduğunda geri açılır.
  const restoreAfterAutoplay = () => {
    if (!mutedForAutoplayRef.current) return;
    mutedForAutoplayRef.current = false;
    setAutoplayMuted(false);
    applyVolume(volume, silent);
  };

  // Karşı tarafta oynatma engellendiyse film bu düğmeyle başlar (oynatıcı kontrolleri gizli).
  const startPlayback = () => {
    const player = playerRef.current;
    if (!player?.playVideo) return;
    mutedForAutoplayRef.current = false;
    setAutoplayMuted(false);
    applyVolume(volume, silent);
    player.playVideo();
  };

  // Oynatıcı kurulduğunda / yeniden kurulduğunda kayıtlı seviye uygulanır.
  useEffect(() => { applyVolume(volume, muted); }, [volume, muted, ready]);

  // Video değişince oynatıcı yeniden kurulur ve odanın konumundan başlar.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');
    // Yeni film sıfırdan başlar: eski filmin oynatma durumu taşınmaz.
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current?.destroy?.();
      hostRef.current.innerHTML = '';
      const mount = document.createElement('div');
      mount.className = 'h-full w-full';
      hostRef.current.appendChild(mount);
      playerRef.current = new YT.Player(mount, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { controls: 0, modestbranding: 1, rel: 0, playsinline: 1, iv_load_policy: 3, disablekb: 1, fs: 0, cc_load_policy: 0 },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            setReady(true);
            setDuration(event.target.getDuration?.() || 0);
            const target = syncRef.current?.current_time || 0;
            if (target > 1) event.target.seekTo(target, true);
            // Altyazı modülü hazır olur olmaz kayıtlı tercih uygulanır; modül
            // gecikmeli yüklendiğinde kısa süre sonra tekrar denenir.
            applyCaptions(captionsRef.current);
            setTimeout(() => { if (!cancelled) applyCaptions(captionsRef.current); }, 1200);
            // Film odaya açıldığında karşı taraf da başlasın: oynatma birkaç kez denenir,
            // sesli otomatik başlatma engellenirse sessiz başlatmaya geçilir.
            const attemptPlay = (allowMute) => {
              if (cancelled || !syncRef.current?.is_playing) return;
              const player = playerRef.current;
              if (!player?.getPlayerState) return;
              if (player.getPlayerState() === window.YT?.PlayerState?.PLAYING) return;
              // Tampon bekleyen oynatıcı sessize alınmaz: ses, gereksiz yere kapanmaz.
              if (allowMute && player.getPlayerState?.() !== window.YT?.PlayerState?.BUFFERING) {
                player.mute?.();
                mutedForAutoplayRef.current = true;
                setAutoplayMuted(true);
              }
              player.playVideo?.();
            };
            [[0, false], [700, false], [1600, true], [3200, true]].forEach(([delay, allowMute]) => {
              setTimeout(() => { if (!cancelled) attemptPlay(allowMute); }, delay);
            });
          },
          onError: () => setError('Bu video oynatılamıyor. Başka bir YouTube linki dene.'),
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (event.data === state?.PLAYING) {
              setPlaying(true);
              clearTimeout(pauseTimerRef.current);
              if (sourceRef.current) onPlayPause?.(true);
            } else if (event.data === state?.PAUSED) {
              setPlaying(false);
              // Anlık duraklama (sarma, tampon, arka plan) odaya yazılmaz: duraklatma
              // 700 ms sonra hâlâ geçerliyse bildirilir, karşı taraf boşuna durmaz.
              if (sourceRef.current) {
                clearTimeout(pauseTimerRef.current);
                pauseTimerRef.current = setTimeout(() => {
                  const active = playerRef.current;
                  if (!active?.getPlayerState) return;
                  if (active.getPlayerState() === window.YT?.PlayerState?.PLAYING) return;
                  onPlayPause?.(false);
                }, 700);
              }
            } else if (event.data === state?.ENDED) {
              setPlaying(false);
              onEnded?.();
            }
          },
        },
      });
    });
    return () => { cancelled = true; clearTimeout(pauseTimerRef.current); playerRef.current?.destroy?.(); playerRef.current = null; };
  }, [videoId]);

  useEffect(() => {
    if (suppressControls) setShowControls(false);
  }, [suppressControls]);

  // Film sesi: arka plana geçildiğinde mikrofon sızıntısını önlemek için sessize al.
  useEffect(() => {
    if (!ready) return;
    const onVisibility = () => {
      const player = playerRef.current;
      if (!player?.mute) return;
      if (document.visibilityState === 'hidden') player.mute();
      else if (!silent) player.unMute();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [ready, silent]);

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
      // İzleyici tarafı: oda oynatıyorsa film kendiliğinden duraklayıp kalmaz.
      // Beklenen konumdan belirgin sapma varsa hizalanır, ufak farkta dokunulmaz.
      if (!isTimeSource) {
        const base = baselineRef.current;
        if (base.playing && Date.now() > seekGuardRef.current) {
          const expected = base.time + (Date.now() - base.at) / 1000;
          const drift = (player.getCurrentTime() || 0) - expected;
          if (Math.abs(drift) > SYNC_TOLERANCE + 2) {
            player.seekTo(expected, true);
            seekGuardRef.current = Date.now() + 2500;
          } else if (player.getPlayerState?.() === state?.PAUSED && Date.now() > playNudgeRef.current) {
            playNudgeRef.current = Date.now() + 3000;
            player.playVideo?.();
          }
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [ready, isTimeSource, onTimeUpdate]);

  // Odadan gelen konum: bildirimin alındığı an saklanır, beklenen konum o andan
  // hesaplanır — aradaki gecikme filmi geri sarmaz. Küçük farklar düzeltilmez.
  useEffect(() => {
    baselineRef.current = {
      time: syncState?.current_time || 0,
      playing: !!syncState?.is_playing,
      at: Date.now(),
    };
    if (!ready || isTimeSource) return;
    const player = playerRef.current;
    if (!player?.getCurrentTime) return;
    const state = window.YT?.PlayerState;
    const target = syncState?.current_time || 0;
    // Yalnızca belirgin sapmada hizalanır: film kendi akışında oynamaya devam eder.
    if (Math.abs((player.getCurrentTime() || 0) - target) > SYNC_TOLERANCE) {
      player.seekTo(target, true);
      seekGuardRef.current = Date.now() + 2000;
    }
    // Duraklatma yalnızca oda gerçekten duraklatıldığında uygulanır.
    if (!syncState?.is_playing && player.getPlayerState?.() === state?.PLAYING) {
      player.pauseVideo();
      seekGuardRef.current = Date.now() + 1500;
    }
  }, [ready, isTimeSource, syncState?.current_time, syncState?.is_playing, syncState?.last_sync]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const togglePlay = () => {
    if (!isOwner) return;
    const player = playerRef.current;
    if (!player?.getPlayerState) return;
    // Düğme oynatıcının gerçek durumuna göre çalışır: eski filmden kalan durum yanlış komut vermez.
    const playingNow = player.getPlayerState() === window.YT?.PlayerState?.PLAYING;
    if (playingNow) player.pauseVideo?.();
    else player.playVideo?.();
    // Yetkili kişi düğmeye bastığında oda da güncellenir; kendiliğinden durum
    // değişimleri (tampon, otomatik başlatma) odaya yazılmaz.
    if (!isTimeSource && onPlayPause) onPlayPause(!playingNow);
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
    onControlsChange?.(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { setShowControls(false); onControlsChange?.(false); }, 4000);
  };

  // Kaydırma katmanından gelen dokunma sinyali: kontroller yeniden görünür.
  useEffect(() => {
    if (revealSignal) showCtrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealSignal]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black select-none"
      onMouseMove={showCtrl}
      onPointerDown={restoreAfterAutoplay}
      onTouchStart={restoreAfterAutoplay}
      onClick={() => {
        showCtrl();
        const player = playerRef.current;
        if (player?.getPlayerState?.() !== window.YT?.PlayerState?.PLAYING && syncState?.is_playing) player?.playVideo?.();
      }}
      style={{ touchAction: isOwner ? 'manipulation' : 'none' }}
    >
      <div ref={hostRef} className="film-yt-frame h-full w-full" />

      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-amber-300">{error}</div>}

      {/* İzleyicide otomatik başlatma engellendiğinde film tek dokunuşla başlar. */}
      {!isOwner && ready && !error && syncState?.is_playing && !playing && (
        <button
          type="button"
          onClick={(event) => { event.stopPropagation(); startPlayback(); }}
          className="absolute inset-0 z-[58] flex flex-col items-center justify-center gap-2 bg-black/45"
        >
          <span className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-lg">
            <Play className="h-5 w-5" /> Filmi başlat
          </span>
          <span className="text-[11px] font-semibold text-white/70">Oda sahibi filmi açtı — dokun ve izle</span>
        </button>
      )}

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
        {IOS_VOLUME_LOCKED && (
          <p className="mb-1 text-xs font-semibold text-white/60">YouTube sesi iPhone’da telefonun ses tuşlarıyla azaltılır.</p>
        )}
        <div className="flex items-center gap-1 text-white sm:gap-2">
          {autoplayMuted && !silent && (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); restoreAfterAutoplay(); }}
              className="rounded-lg bg-primary/90 px-2.5 py-1.5 text-[11px] font-extrabold text-primary-foreground"
            >
              Sesi aç
            </button>
          )}
          {isOwner && <button onClick={togglePlay} aria-label={playing ? 'Duraklat' : 'Oynat'} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10">{playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>}
          {isOwner && <button onClick={() => skip(-10)} aria-label="10 saniye geri" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10" title="10 sn geri"><Rewind className="h-5 w-5" /></button>}
          {isOwner && <button onClick={() => skip(10)} aria-label="10 saniye ileri" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10" title="10 sn ileri"><FastForward className="h-5 w-5" /></button>}
          {IOS_VOLUME_LOCKED ? (
            <button
              type="button"
              disabled={!ready}
              aria-label={silent ? 'Sesi aç' : 'Sesi kapat'}
              aria-pressed={silent}
              onPointerDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              onTouchEnd={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); toggleMute(); }}
              className="relative z-[70] rounded-lg p-2 hover:bg-foreground/10 disabled:opacity-50"
            >
              {silent ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          ) : (
            <VolumeSlider volume={volume / 100} muted={silent} onChange={changeVolume} onToggleMute={toggleMute} nativeFallback />
          )}
          <button
            type="button"
            disabled={!ready}
            aria-label={captions ? 'Altyazıyı kapat' : 'Altyazıyı aç'}
            aria-pressed={captions}
            title={captions ? 'Altyazıyı kapat' : 'Altyazıyı aç'}
            onPointerDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); toggleCaptions(); }}
            className={`relative z-[70] rounded-lg p-2 hover:bg-white/10 disabled:opacity-50 ${captions ? 'text-primary' : 'text-white/70'}`}
          >
            {captions ? <Captions className="h-5 w-5" /> : <CaptionsOff className="h-5 w-5" />}
          </button>
          <button onClick={toggleFullscreen} aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'} className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10" title="Tam ekran">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}