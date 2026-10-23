import { Image } from '@/components/ui/image';

/** Avatar etrafında dairesel ilerleme halkası ve seviye rozeti. */
export default function LevelHeroOrb({ avatar, label, level, percent, tone }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto h-[150px] w-[150px]">
      <span className="absolute inset-0 rounded-full blur-2xl" style={{ background: `${tone}55` }} />
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="url(#lvlGrad)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(percent, 2) / 100)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
        <defs>
          <linearGradient id="lvlGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="55%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#ffd76a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-[18px] overflow-hidden rounded-full border-2" style={{ borderColor: tone }}>
        {avatar
          ? <Image src={avatar} alt={label} fittingType="fill" className="h-full w-full" />
          : <span className="flex h-full w-full items-center justify-center bg-[#1b1130] text-3xl font-black text-white/70">{label[0]?.toUpperCase()}</span>}
      </div>
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-white/40 px-3 py-0.5 text-sm font-black text-[#1a0b2e]"
        style={{ background: 'linear-gradient(135deg,#fff3c4,#ffd76a 50%,#f472b6)', boxShadow: '0 0 18px rgba(255,215,106,.6)' }}>
        Lv{level}
      </span>
    </div>
  );
}