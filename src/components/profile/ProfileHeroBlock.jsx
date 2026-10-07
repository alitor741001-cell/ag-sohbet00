import { Crown, Heart } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';

/** Profil kartının üst bölümü: çerçeveli profil fotoğrafı, cinsiyet rozeti ve süslü isim alanı. */
export default function ProfileHeroBlock({ name, avatar, frame, frameScale, palette, hidden, roleLabel, statusLabel }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ filter: `drop-shadow(0 0 20px ${palette.glow})` }}>
        <ProfileFrame frame={frame} avatar={avatar} name={name} size="lg" frameScale={frameScale} />
        <span
          className="absolute -bottom-1 left-[62%] z-[3] flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 text-base font-black"
          style={{ borderColor: palette.accent2, background: '#07040a', color: palette.accent, boxShadow: `0 0 14px ${palette.glow}` }}
        >
          {hidden ? '?' : palette.symbol}
        </span>
      </div>

      {statusLabel && <p className="mt-2 text-center text-[11px] font-black tracking-[0.3em] text-destructive">{statusLabel}</p>}

      <div className="mt-5 flex w-full items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider" style={{ color: palette.accent2 }}>
          <Crown className="h-3 w-3" />
          <Heart className="h-3 w-3" fill="currentColor" />
          Her zaman Daha Güçlü
        </span>
        <span className="text-lg leading-none" style={{ color: palette.accent2, fontFamily: "'Great Vibes', cursive" }}>
          Sen Özelsin
        </span>
      </div>

      <p
        className="mt-1 max-w-full break-words text-center text-3xl font-black leading-tight"
        style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: `0 0 10px ${palette.glow}, 0 0 28px ${palette.glow}` }}
      >
        {name}
      </p>
      {roleLabel && <p className="mt-1 text-[11px] font-bold" style={{ color: palette.accent2 }}>{roleLabel}</p>}
    </div>
  );
}