import { Crown, Heart } from 'lucide-react';
import CrystalCrown from '@/components/profile/crystal/CrystalCrown';
import { crystalSkin } from '@/components/profile/crystal/crystalTheme';

/**
 * Referanstaki isim bölümü: solda altın taç + kalp ile "HER ZAMAN DAHA GÜÇLÜ",
 * sağda taç üstünde el yazısı "Sen Özelsin", altta taçlarla çevrili mavi gradyan isim.
 */
export default function CrystalNameBlock({ name, roleLabel = '', tone = 'blue', slogan = 'HER ZAMAN DAHA GÜÇLÜ', signature = 'Sen Özelsin' }) {
  const c = crystalSkin(tone);

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-[3px]">
          <Crown className="h-[11px] w-[11px] shrink-0" style={{ color: '#f5cf3f' }} fill="#f5cf3f" fillOpacity={0.3} strokeWidth={2.2} />
          <Heart className="h-[9px] w-[9px] shrink-0" style={{ color: '#f5cf3f' }} fill="#f5cf3f" strokeWidth={2} />
          <span
            className="text-[7px] font-black uppercase leading-[1.15] tracking-[0.08em]"
            style={{ color: '#f5cf3f', textShadow: '0 1px 3px rgba(0,0,0,0.75)' }}
          >
            {slogan}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <Crown className="h-[9px] w-[9px]" style={{ color: c.gold }} fill={c.gold} fillOpacity={0.35} strokeWidth={2.2} />
          <span
            className="italic leading-none"
            style={{ fontFamily: 'cursive', fontSize: 11, color: '#ffffff', textShadow: `0 0 10px ${c.glow}` }}
          >
            {signature}
          </span>
        </div>
      </div>

      <div className="mt-[3px] flex items-center justify-center gap-1.5">
        <CrystalCrown size={17} className="shrink-0" />
        <p
          className="max-w-[190px] truncate text-center text-[25px] font-black uppercase leading-none tracking-[0.03em]"
          style={{
            background: 'linear-gradient(180deg, #f4fbff 0%, #b6e4ff 30%, #57aff2 62%, #1d5ea8 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 0 10px ${c.glow})`,
          }}
        >
          {name}
        </p>
        <CrystalCrown size={17} className="shrink-0" />
      </div>

      {roleLabel && (
        <p className="mt-1 truncate text-center text-[9px] font-black tracking-[0.32em]" style={{ color: c.gold }}>
          {roleLabel}
        </p>
      )}
    </div>
  );
}