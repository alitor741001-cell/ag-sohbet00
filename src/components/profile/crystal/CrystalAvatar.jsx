import { Image } from '@/components/ui/image';
import CrystalWings from '@/components/profile/crystal/CrystalWings';
import CrystalCrown from '@/components/profile/crystal/CrystalCrown';
import CrystalVipShield from '@/components/profile/crystal/CrystalVipShield';
import { GOLD_LINE, crystalSkin } from '@/components/profile/crystal/crystalTheme';

/**
 * Referanstaki fotoğraf bölümü: iki yanda kristal kanatlar, üstte büyük taç,
 * kanat diplerinde iki küçük taç, altın-mavi halkalı fotoğraf, cinsiyet rozeti ve VIP kalkanı.
 */
export default function CrystalAvatar({ avatar, name, genderSymbol = '♂', vipLevel = 0, tone = 'blue' }) {
  const c = crystalSkin(tone);

  return (
    <div className="relative mx-auto flex w-full flex-col items-center">
      <div className="relative h-[104px] w-[104px]">
        <CrystalWings tone={tone} />

        <CrystalCrown size={36} className="absolute left-1/2 top-[-31px] z-[5] -translate-x-1/2" />
        <CrystalCrown size={15} className="absolute bottom-[1px] left-[-56px] z-[4] -rotate-[12deg]" />
        <CrystalCrown size={15} className="absolute bottom-[1px] right-[-56px] z-[4] rotate-[12deg]" />

        <div
          className="relative h-full w-full rounded-full p-[3px]"
          style={{ background: GOLD_LINE, boxShadow: `0 0 30px -4px ${c.glow}` }}
        >
          <div
            className="h-full w-full rounded-full p-[2px]"
            style={{ background: `linear-gradient(180deg, ${c.blue}, rgba(3,12,26,0.95))`, boxShadow: `inset 0 0 12px ${c.glow}` }}
          >
            <div className="h-full w-full overflow-hidden rounded-full p-[1px]" style={{ background: '#040a14' }}>
              {avatar ? (
                <Image
                  src={avatar}
                  alt={name || 'Profil'}
                  fittingType="fill"
                  className="h-full w-full rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center rounded-full bg-[#0b1f3c] text-3xl font-black text-white/80">
                  {(name || '?')[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        <span
          className="absolute -bottom-[2px] -right-[2px] z-[6] flex h-[23px] w-[23px] items-center justify-center rounded-full text-[11px] font-black text-white"
          style={{ background: c.genderFill, border: '1.5px solid #f4dda4', boxShadow: `0 0 12px -2px ${c.glow}` }}
        >
          {genderSymbol}
        </span>
      </div>

      {vipLevel > 0 && <CrystalVipShield level={vipLevel} />}
    </div>
  );
}