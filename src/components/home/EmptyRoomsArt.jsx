import { Link } from 'react-router-dom';
import { Plus, Radio } from 'lucide-react';

/** Sıcaklar sekmesinde açık yayın yokken gösterilen hafif boş durum. */
export default function EmptyRoomsArt() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6">
      <div className="pointer-events-auto flex w-full max-w-[300px] flex-col items-center gap-3 rounded-3xl border border-primary/30 bg-[#0a0a12]/85 p-6 text-center shadow-[0_0_44px_-14px_rgba(239,68,68,0.95)] backdrop-blur">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/15">
          <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-primary/25 blur-xl" />
          <Radio className="relative h-7 w-7 text-white" strokeWidth={2.2} />
        </span>
        <p className="text-sm font-black text-white">Şu anda açık yayın yok</p>
        <p className="text-[11px] leading-relaxed text-white/60">İlk odayı sen aç, arkadaşların katılsın.</p>
        <Link
          to="/oda-kur"
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-primary/60 bg-gradient-to-b from-[#ef4343] to-[#a51d1d] px-4 py-2 text-[12px] font-black text-white shadow-[0_0_20px_-6px_rgba(239,68,68,1)] active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} /> Oda Kur
        </Link>
      </div>
    </div>
  );
}