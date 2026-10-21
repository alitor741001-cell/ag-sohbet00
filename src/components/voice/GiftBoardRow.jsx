import { Coins, Crown } from 'lucide-react';
import { Image } from '@/components/ui/image';
import UserBadgeRow from '@/components/status/UserBadgeRow';
import { isHiddenName } from '@/lib/hiddenUser';

// İlk üç sıra: altın, gümüş-mavi ve bronz çerçeve ile taç rozeti.
const RANK_TONES = {
  1: {
    frame: 'linear-gradient(145deg,#fff3c9,#f5c542 55%,#a86a12)',
    badge: 'linear-gradient(160deg,#fbe08a,#e0a72a 55%,#a86a12)',
    crown: '#f7d97a',
    glow: 'rgba(251,191,36,0.55)',
    text: '#3a2404',
  },
  2: {
    frame: 'linear-gradient(145deg,#f4f9ff,#a8c6ee 55%,#3b6fc4)',
    badge: 'linear-gradient(160deg,#eef5ff,#9dbde8 55%,#3b6fc4)',
    crown: '#c9dcf7',
    glow: 'rgba(147,197,253,0.5)',
    text: '#152a4d',
  },
  3: {
    frame: 'linear-gradient(145deg,#fbd9b4,#d08b4f 55%,#8a4a1e)',
    badge: 'linear-gradient(160deg,#f8c79a,#cf8a4c 55%,#8a4a1e)',
    crown: '#f0b98a',
    glow: 'rgba(251,146,60,0.45)',
    text: '#3a1c05',
  },
};

/** 5.420.000 → 5.42M, 804.420 → 804.42k */
const compactScore = (value) => {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(2)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(2)}k`;
  return String(Math.round(number));
};

/** Zenginlik listesi satırı: sıra, profil çerçevesi, isim/rozetler ve toplam hediye. */
export default function GiftBoardRow({ rank, entry, profile }) {
  const tone = RANK_TONES[rank];
  const hidden = entry.hidden || isHiddenName(entry.name);
  const name = entry.name || 'Kullanıcı';

  return (
    <div className="flex items-center gap-2.5 border-b border-sky-300/15 py-2.5 last:border-b-0">
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
        {tone ? (
          <>
            <Crown className="absolute -top-2 h-3.5 w-3.5" style={{ color: tone.crown }} fill="currentColor" strokeWidth={1.4} />
            <span
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[11px] font-black leading-none"
              style={{ backgroundImage: tone.badge, color: tone.text, boxShadow: `0 0 10px ${tone.glow}` }}
            >
              {rank}
            </span>
          </>
        ) : (
          <span className="text-[13px] font-black tabular-nums text-[#fde68a]/85">{rank}</span>
        )}
      </span>

      <span
        className="h-11 w-11 shrink-0 rounded-full p-[2px]"
        style={tone
          ? { backgroundImage: tone.frame, boxShadow: `0 0 12px ${tone.glow}` }
          : { backgroundImage: 'linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.06))' }}
      >
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#0f1b3d] ring-1 ring-white/10">
          {entry.avatar ? (
            <Image src={entry.avatar} alt={name} className="h-full w-full" fittingType="fill" draggable={false} />
          ) : (
            <span className="text-sm font-bold text-white/70">{name.trim().charAt(0).toUpperCase()}</span>
          )}
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-extrabold leading-tight ${hidden ? 'hidden-user-name' : 'text-white'}`}>{name}</p>
        {!hidden && (
          <div className="mt-0.5 flex items-center overflow-hidden">
            <UserBadgeRow profile={profile} compact />
          </div>
        )}
      </div>

      <span className="flex shrink-0 items-center gap-1">
        <Coins className="h-3.5 w-3.5" style={{ color: tone ? '#fbbf24' : '#93c5fd' }} />
        <span className="text-[13px] font-black tabular-nums" style={{ color: tone ? '#fde68a' : '#e2e8f0' }}>
          {compactScore(entry.score)}
        </span>
      </span>
    </div>
  );
}