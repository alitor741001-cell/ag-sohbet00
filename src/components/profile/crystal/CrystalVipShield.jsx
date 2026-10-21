import { GOLD_LINE } from '@/components/profile/crystal/crystalTheme';

/** Fotoğrafın altında asılı duran altın VIP kalkanı (referanstaki beyaz VIP yazılı rozet). */
export default function CrystalVipShield({ level = 0 }) {
  return (
    <span
      className="relative z-[4] -mt-[9px] flex h-[32px] w-[46px] flex-col items-center justify-start pt-[3px]"
      style={{
        background: GOLD_LINE,
        clipPath: 'polygon(0 0, 100% 0, 100% 63%, 50% 100%, 0 63%)',
        filter: 'drop-shadow(0 3px 9px rgba(214,170,60,0.8))',
      }}
    >
      <span
        className="text-[10px] font-black leading-none tracking-[0.05em]"
        style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}
      >
        VIP
      </span>
      {level > 0 && (
        <span className="text-[8px] font-black leading-none" style={{ color: '#2a1f04' }}>
          {level}
        </span>
      )}
    </span>
  );
}