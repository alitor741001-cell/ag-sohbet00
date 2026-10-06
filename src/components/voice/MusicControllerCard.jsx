import { ChevronDown, ListMusic, Pause, Play, Power, SkipForward, Volume2 } from 'lucide-react';

/** Açılan müzik paneli: şarkıyı yönet, ses seviyesini bu cihazda canlı ayarla. */
export default function MusicControllerCard({ title, playing, volume, onVolume, isMod, onToggle, onNext, onOpenList, onStop, onCollapse }) {
  return (
    <div
      role="group"
      aria-label="Müzik denetleyicisi"
      className="premium-panel fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 z-[210] w-[min(92vw,22rem)] -translate-x-1/2 rounded-[22px] px-3.5 py-3"
    >
      <div className="flex items-center gap-2">
        {isMod ? (
          <button type="button" onClick={onStop} aria-label="Müziği durdur" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/85 active:scale-95">
            <Power className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-8 w-8 shrink-0" />
        )}
        <p className="min-w-0 flex-1 truncate text-center text-[13px] font-semibold text-white">{title || 'Şarkı'}</p>
        <button type="button" onClick={onCollapse} aria-label="Müzik denetleyicisini kapat" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/85 active:scale-95">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {isMod && (
        <div className="mt-2 flex items-center justify-center gap-7">
          <button type="button" onClick={onOpenList} aria-label="Şarkı listesi" className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 active:scale-95">
            <ListMusic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-label={playing ? 'Duraklat' : 'Çal'}
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/85 text-white shadow-[0_0_16px_-6px_rgba(255,215,0,0.95)] active:scale-95"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
          <button type="button" onClick={onNext} aria-label="Sonraki şarkı" className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 active:scale-95">
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ses seviyesi yalnızca bu cihazda değişir; şarkı çalarken anında etki eder. */}
      <div className="mt-2.5 flex items-center gap-2.5">
        <Volume2 className="h-4 w-4 shrink-0 text-white/75" />
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((Number(volume) || 0) * 100)}
          onInput={(event) => onVolume(Number(event.currentTarget.value) / 100)}
          onChange={(event) => onVolume(Number(event.currentTarget.value) / 100)}
          className="h-1.5 min-w-0 flex-1 accent-[#FFD700]"
          aria-label="Müzik ses seviyesi"
        />
        <span className="w-9 shrink-0 text-right text-[11px] font-bold tabular-nums text-white/75">{Math.round((Number(volume) || 0) * 100)}%</span>
      </div>
    </div>
  );
}