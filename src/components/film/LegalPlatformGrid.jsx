import { Play } from 'lucide-react';

/** Yasal izleme: YouTube uygulamanın içinde oynar, seçilen film uygulamadan çıkmaz. */
export default function LegalPlatformGrid({ onYouTube }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4">
      <h2 className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-white/45">Yasal izleme platformları</h2>
      <button
        type="button"
        onClick={() => onYouTube?.()}
        className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-[#ff0033]/35 to-transparent bg-[#0b0d16] px-3 py-3 text-left transition active:scale-95"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/50 text-xs font-black text-white">
          ▶
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-extrabold text-white">YouTube</span>
        <Play className="h-3.5 w-3.5 shrink-0 text-white/40" />
      </button>
    </section>
  );
}