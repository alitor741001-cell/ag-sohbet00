import { Crown, Sparkles } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { CHEST_IMAGE_URL, HERO_IMAGE_URL } from '@/components/voice/coinShop/coinShopAssets';

/** Coin mağazası girişi: altın hollü sinematik kapak, başlık ve sandık görseli. */
export default function CoinShopHero() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl"
      style={{
        border: '1px solid rgba(232,185,90,0.4)',
        boxShadow: 'inset 0 1px 0 rgba(255,246,214,0.18), 0 22px 44px -26px rgba(0,0,0,0.95)',
      }}
    >
      <Image src={HERO_IMAGE_URL} alt="" fittingType="fill" className="absolute inset-0 h-full w-full" draggable={false} />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(96deg, rgba(4,7,12,0.97) 0%, rgba(4,7,12,0.86) 40%, rgba(4,7,12,0.28) 74%, rgba(4,7,12,0.6) 100%)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(4,7,12,0) 42%, rgba(4,7,12,0.92) 100%)' }}
      />

      <div className="relative flex items-center gap-2 px-4 py-5">
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-[#f4e1a1]"
            style={{ background: 'rgba(232,185,90,0.14)', border: '1px solid rgba(232,185,90,0.45)' }}
          >
            <Sparkles className="h-3 w-3" /> Alışveriş Merkezi
          </span>
          <p
            className="mt-2 text-[26px] font-black leading-none tracking-tight"
            style={{
              backgroundImage: 'linear-gradient(180deg, #fff6dc 0%, #e8b95a 58%, #b98d34 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.75))',
            }}
          >
            Coin Mağazası
          </p>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">Daha fazlası için coins yükle</p>
          <span className="mt-2.5 block h-px w-24" style={{ background: 'linear-gradient(90deg, rgba(232,185,90,0.85), rgba(232,185,90,0))' }} />
          <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-black italic text-[#f4e1a1]">
            <Crown className="h-3.5 w-3.5" /> Keyfin Hiç Bitmesin!
          </p>
        </div>

        <span className="relative h-32 w-32 shrink-0">
          <span className="absolute inset-2 rounded-full bg-[#E8B95A]/35 blur-2xl" />
          <Image src={CHEST_IMAGE_URL} alt="Altın sandık" className="relative h-full w-full" fittingType="fill" draggable={false} />
        </span>
      </div>
    </div>
  );
}