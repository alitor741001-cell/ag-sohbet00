import { ArrowLeft, Search } from 'lucide-react';

/** Kaynak yokken ekranda çıkan tek seçim: film paneli. */
export default function RoomScreenLauncher({ onSearch }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-black px-6 text-center">
      <div>
        <p className="text-lg font-extrabold text-white">Filmler</p>
        <p className="mt-1 text-xs text-white/50">Film adını yaz ya da kategori seç, odada tam ekran izle.</p>
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="flex w-64 items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-4 transition active:scale-95"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600">
          <Search className="h-5 w-5 text-white" />
        </span>
        <span className="text-left">
          <span className="block text-sm font-bold text-white">Film Ara</span>
          <span className="block text-[10px] text-white/50">Tüm filmler, tek dokunuşta</span>
        </span>
      </button>
      <p className="max-w-xs text-[10px] leading-relaxed text-white/40">
        Arama uygulamanın içinde çalışır. Seçtiğin film odanın ekranında, herkes aynı anda ve tam ekran izler.
      </p>
    </div>
  );
}

/** Yayın oynarken ekranın üstünde duran film paneli düğmesi. */
export function RoomScreenSwitch({ onFilms, hasResults }) {
  const base = 'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold border backdrop-blur-md transition active:scale-95';
  return (
    <button type="button" onClick={onFilms} className={`${base} border-white/15 bg-black/60 text-white/80`}>
      {hasResults
        ? <><ArrowLeft className="h-3.5 w-3.5" /> Geri</>
        : <><Search className="h-3.5 w-3.5" /> Filmler</>}
    </button>
  );
}