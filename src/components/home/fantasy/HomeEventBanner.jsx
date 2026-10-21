import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

/** Ana sayfa altındaki altın çerçeveli etkinlik afişi: doğrudan oda kurulumuna götürür. */
export default function HomeEventBanner() {
  return (
    <Link
      to="/oda-kur"
      className="relative mt-4 block overflow-hidden rounded-[22px] p-[1.5px] active:scale-[0.99]"
      style={{ background: 'linear-gradient(135deg,#f7e2b0,#8b6a2e 38%,#f7e2b0 66%,#8b6a2e)' }}
    >
      <div
        className="relative overflow-hidden rounded-[21px] px-4 py-4"
        style={{ background: 'radial-gradient(120% 140% at 8% 0%, rgba(127,240,230,0.3), transparent 55%), linear-gradient(135deg,#0b2144 0%,#1b1140 58%,#06101f 100%)' }}
      >
        <span aria-hidden="true" className="absolute -right-6 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.65), transparent 70%)' }} />
        <span aria-hidden="true" className="absolute -bottom-8 left-10 h-24 w-24 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(127,240,230,0.45), transparent 70%)' }} />

        <div className="relative flex items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(127,240,230,0.35), rgba(124,92,255,0.45))', border: '1px solid rgba(240,214,154,0.65)' }}
          >
            <Sparkles className="h-5 w-5 text-[#ffe6a8]" />
          </span>
          <div className="min-w-0">
            <p className="text-[9.5px] font-black tracking-[0.22em] text-[#ffe6a8]">FİLMKEYFİ · ETKİNLİK</p>
            <p className="truncate text-[14px] font-black text-white">Kendi odanı kur, sesi yükselt</p>
            <p className="truncate text-[10.5px] font-medium text-white/60">Arkadaşlarını davet et, kristal odada buluş.</p>
          </div>
          <span
            className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black text-[#062033]"
            style={{ background: 'linear-gradient(135deg,#d8fffb,#6fe6dc 55%,#ffe6a8)' }}
          >
            ODA KUR
          </span>
        </div>
      </div>
    </Link>
  );
}