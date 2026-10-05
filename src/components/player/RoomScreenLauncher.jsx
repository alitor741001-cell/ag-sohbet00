import { ExternalLink, Play, Search } from 'lucide-react';
import { openGoogle } from '@/lib/mediaSource';

/** Kaynak yokken ekranda çıkan seçim: Google araması ya da odada YouTube. */
export default function RoomScreenLauncher({ onYouTube }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-black px-6 text-center">
      <div>
        <p className="text-lg font-extrabold text-white">Ekranı seç</p>
        <p className="mt-1 text-xs text-white/50">Google'da ara ya da YouTube videosunu odada birlikte izle.</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => openGoogle()} className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 transition active:scale-95">
          <Search className="h-7 w-7 text-white" />
          <span className="text-xs font-bold text-white">Google</span>
        </button>
        <button type="button" onClick={onYouTube} className="flex h-24 w-28 flex-col items-center justify-center gap-2 rounded-2xl border border-red-500/40 bg-red-500/10 transition active:scale-95">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
            <Play className="h-4 w-4 fill-white text-white" />
          </span>
          <span className="text-xs font-bold text-white">YouTube</span>
        </button>
      </div>
      <p className="max-w-xs text-[10px] leading-relaxed text-white/40">
        Google yeni sekmede açılır. YouTube videosu odanın ekranında, herkes aynı anda ve tam ekran izler.
      </p>
    </div>
  );
}

/** Yayın oynarken ekranın üstünde duran küçük kaynak değiştirme şeridi. */
export function RoomScreenSwitch({ onGoogle, onYouTube, active }) {
  const base = 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border backdrop-blur-md transition active:scale-95';
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onGoogle} className={`${base} border-white/15 bg-black/60 text-white/80`}>
        <Search className="h-3.5 w-3.5" /> Google
        <ExternalLink className="h-3 w-3 opacity-70" />
      </button>
      <button type="button" onClick={onYouTube} className={`${base} ${active ? 'border-red-500/70 bg-red-600/80 text-white' : 'border-white/15 bg-black/60 text-white/80'}`}>
        <Play className="h-3.5 w-3.5" /> YouTube
      </button>
    </div>
  );
}