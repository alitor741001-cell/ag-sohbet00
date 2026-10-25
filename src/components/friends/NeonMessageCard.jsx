import { Crown } from 'lucide-react';

// Özel sohbet mesaj kartı: kızlar pembe neon, erkekler mavi neon tasarım (şeffaf zemin).
const THEMES = {
  female: { ring: '#ff3fd8', glow: 'rgba(255,63,216,0.55)', name: '#ff9cf0', pill: 'rgba(255,255,255,0.08)', sign: '♡', font: "'Brush Script MT', 'Segoe Script', cursive" },
  male: { ring: '#1e9bff', glow: 'rgba(30,155,255,0.55)', name: '#7cc7ff', pill: 'rgba(30,90,200,0.45)', sign: '♂', font: "Inter, sans-serif" },
};

export default function NeonMessageCard({ gender, name, avatar, time, footer, aside, badge, children }) {
  const female = gender !== 'erkek';
  const t = female ? THEMES.female : THEMES.male;
  return (
    <div className="relative w-full rounded-[22px] border-2 px-3 py-2.5" style={{ borderColor: t.ring, background: 'transparent', boxShadow: `0 0 14px ${t.glow}, inset 0 0 14px ${t.glow}` }}>
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          {female && <Crown className="absolute -left-2 -top-3 h-5 w-5 -rotate-12" style={{ color: t.ring, filter: `drop-shadow(0 0 4px ${t.ring})` }} />}
          <div className="h-14 w-14 overflow-hidden rounded-full border-2" style={{ borderColor: t.ring, boxShadow: `0 0 10px ${t.glow}` }}>
            {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center bg-black/40 text-lg font-bold text-white">{(name || '?')[0]}</div>}
          </div>
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-black" style={{ background: female ? '#22c55e' : t.ring }} />
          {badge}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-lg font-bold italic" style={{ color: t.name, fontFamily: t.font, textShadow: `0 0 8px ${t.glow}` }}>{name} <span style={{ color: t.ring }}>{t.sign}</span></span>
            <span className="shrink-0 text-[11px] text-white/80">{time}</span>
          </div>
          <div className="mt-1 rounded-2xl px-3 py-1.5 text-sm text-white" style={{ background: t.pill }}>{children}</div>
          {footer && <div className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: t.name }}>{footer}</div>}
        </div>
        {aside && <div className="self-center shrink-0" style={{ color: t.name }}>{aside}</div>}
      </div>
    </div>
  );
}