import { useEffect, useState } from 'react';
import { ExternalLink, Link2, Play } from 'lucide-react';
import { openYouTube, youtubeIdFromUrl } from '@/lib/mediaSource';

/** Odaya YouTube linki bırakma paneli: link yapıştırılır, video odada senkron oynar. */
export default function YouTubeLinkSheet({ open, onClose, canMod, currentVideoId = '', onPlay }) {
  const [value, setValue] = useState('');

  useEffect(() => { if (open) setValue(''); }, [open]);

  if (!open) return null;

  const videoId = youtubeIdFromUrl(value);

  const submit = () => {
    if (!videoId) return;
    onPlay?.(videoId);
    onClose?.();
  };

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-[85] rounded-t-2xl border-t border-border bg-card/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted-foreground/40" />
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Play className="h-4 w-4 text-red-500" /> YouTube videosu
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {canMod ? 'Linki yapıştır: video odanın ekranında herkes için tam ekran oynar.' : 'Oda sahibi linki seçtiğinde video odada oynar.'}
        </p>

        <div className="relative mt-3">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            inputMode="url"
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-[hsl(var(--secondary))] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-red-500/40"
          />
        </div>

        {currentVideoId && <p className="mt-2 text-[11px] text-muted-foreground">Odada oynayan video: {currentVideoId}</p>}

        <div className="mt-3 flex items-center gap-2">
          {canMod && (
            <button
              type="button"
              onClick={submit}
              disabled={!videoId}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)' }}
            >
              <Play className="h-4 w-4" /> Odada Oynat
            </button>
          )}
          <button
            type="button"
            onClick={() => openYouTube(videoId)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white transition active:scale-95"
          >
            <ExternalLink className="h-4 w-4" /> YouTube'da Aç
          </button>
        </div>

        <button type="button" onClick={onClose} className="mt-2 w-full py-2 text-xs text-muted-foreground">Kapat</button>
      </div>
    </>
  );
}