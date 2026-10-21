import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Armchair, BadgeCheck, Briefcase, Check, CircleDashed, Crown, Flag, HelpCircle, IdCard, Lock, MessageSquare, Mic, UserSquare, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { useCurrentUser } from '@/lib/useCurrentUser';
import VipBagPanel from '@/components/profile/VipBagPanel';
import useVipCosmetics from '@/hooks/useVipCosmetics';

const DRAGON = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/2014bedbf_generated_image.png';

const FEATURES = [
  { key: 'badge', label: 'Kimlik Rozeti', Icon: BadgeCheck },
  { key: 'frame', label: 'Avatar Çerçevesi', Icon: CircleDashed },
  { key: 'banner', label: 'Giriş Bannerı', Icon: Flag },
  { key: 'mic', label: 'Mikrofon Dalgası', Icon: Mic },
  { key: 'bubble', label: 'Sohbet Balonu', Icon: MessageSquare },
  { key: 'card', label: 'Profil Kartı', Icon: IdCard },
  { key: 'ride', label: 'VIP Aracı', Icon: Crown },
  { key: 'room-card', label: 'Oda Kartı', Icon: UserSquare },
  { key: 'seat', label: 'Oda VIP Koltuğu', Icon: Armchair },
];

const LEVELS = [5, 6, 7, 8, 9, 10, 11, 12];

/** VIP merkezi: VIP5–VIP12 seviyeleri, kimlik rozeti imtiyazları ve çanta girişi. */
export default function VipLevels() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const current = Math.min(12, Math.max(5, Number(user?.vip_level) || 5));
  const [level, setLevel] = useState(current);
  const [bagOpen, setBagOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  // Ürünler VIP seviyesiyle birlikte kendiliğinden açılır; kişi tek tek kaldırabilir.
  const { items: cosmetics, level: myLevel, busy, toggle } = useVipCosmetics(true);
  const owned = myLevel >= 5;

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/profil');
  };

  return (
    <div
      className="dark min-h-screen text-white"
      style={{ background: 'radial-gradient(130% 70% at 50% 0%, #3b1d0c 0%, #1d0b2e 42%, #0a0410 100%)' }}
    >
      <header className="sticky top-0 z-20 flex items-center gap-2 bg-transparent px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="flex-1 text-center text-base font-extrabold tracking-[0.2em]">VIP</h1>
        <button
          type="button"
          onClick={() => setHelpOpen((value) => !value)}
          aria-label="Yardım"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/30 active:scale-95"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </header>

      {helpOpen && (
        <p className="mx-auto mb-2 max-w-md rounded-2xl border border-[#c5a574]/40 bg-black/50 px-4 py-3 text-[11.5px] font-semibold leading-relaxed text-[#e8dccb]">
          VIP seviyeleri coin yükleyerek kazanılır. Her seviyenin rozeti, çerçevesi, giriş bannerı ve oda koltuğu farklıdır.
          Seviye yükseldikçe imtiyazlar açılır.
        </p>
      )}

      {/* Ejder heykeli ve seviye şeridi */}
      <div className="relative mx-auto w-full max-w-md px-4 md:max-w-lg">
        <div className="relative mx-auto flex h-44 w-full items-center justify-center">
          <div
            className="absolute bottom-2 h-16 w-40 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(255,150,60,0.7), transparent 70%)' }}
          />
          <Image src={DRAGON} alt="VIP ejderi" fittingType="fit" className="relative h-44 w-full" />
        </div>

        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-3xl font-black tracking-tight" style={{ color: '#f4d03f', textShadow: '0 0 22px rgba(244,208,63,0.55)' }}>
            VIP{level}
          </span>
        </div>

        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LEVELS.map((item) => {
            const active = item === level;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setLevel(item)}
                className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition active:scale-95 ${
                  active ? 'text-white' : 'border border-[#c5a574]/30 bg-black/35 text-white/55'
                }`}
                style={active ? { background: 'linear-gradient(135deg,#b4761f,#f4d03f)', color: '#2a1503', boxShadow: '0 0 18px -4px rgba(244,208,63,0.9)' } : undefined}
              >
                VIP{item}
              </button>
            );
          })}
        </div>
      </div>

      {/* Parşömen gövde: kimlik rozeti imtiyazları */}
      <div className="relative mx-auto w-full max-w-md px-2 pb-24 md:max-w-lg">
        <div
          className="mt-1 rounded-t-[26px] px-3 pb-5 pt-5"
          style={{
            background: 'linear-gradient(180deg, #efe3d0 0%, #e0cfb6 55%, #d3bfa3 100%)',
            boxShadow: 'inset 0 12px 24px rgba(120,90,50,0.25), 0 -10px 30px rgba(0,0,0,0.5)',
          }}
        >
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="h-[1px] w-10" style={{ background: 'linear-gradient(90deg, transparent, #a8927a)' }} />
            <span className="text-[13px] font-black tracking-wide" style={{ color: '#4a3520' }}>Kimlik Rozeti</span>
            <span className="h-[1px] w-10" style={{ background: 'linear-gradient(90deg, #a8927a, transparent)' }} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {FEATURES.map(({ key, label, Icon }) => {
              const item = cosmetics.find((cosmetic) => cosmetic.kind === key);
              const unlocked = owned && !!item && level <= myLevel;
              const active = unlocked && item.active;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!unlocked || busy === key}
                  onClick={() => unlocked && toggle(key, !item.active)}
                  className="relative flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 active:scale-[0.97] disabled:active:scale-100"
                  style={{
                    background: unlocked
                      ? 'linear-gradient(180deg, rgba(255,252,244,0.9), rgba(224,207,182,0.7))'
                      : 'linear-gradient(180deg, rgba(190,175,155,0.55), rgba(160,144,124,0.45))',
                    border: `1px solid ${active ? '#c9a227' : '#a8927a'}`,
                    boxShadow: active ? 'inset 0 0 14px rgba(201,162,39,0.45)' : 'inset 0 0 12px rgba(168,146,122,0.3)',
                    opacity: unlocked ? 1 : 0.72,
                  }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: 'radial-gradient(circle at 50% 30%, #3a1d06, #160a02 78%)', border: '1px solid #c5a574' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: unlocked ? '#f4d03f' : '#8b7a63' }} />
                  </span>
                  <span className="text-center text-[9.5px] font-bold leading-tight" style={{ color: '#3d2c18' }}>{label}</span>
                  <span
                    className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[8.5px] font-black"
                    style={unlocked
                      ? (active ? { background: '#1f6b3a', color: '#d7ffe4' } : { background: '#6b2a2a', color: '#ffdcdc' })
                      : { background: 'rgba(58,29,6,0.18)', color: '#5a4732' }}
                  >
                    {!unlocked ? <><Lock className="h-2.5 w-2.5" /> VIP{Math.max(5, level)}</> : active ? <><Check className="h-2.5 w-2.5" /> Aktif</> : <><X className="h-2.5 w-2.5" /> Kapalı</>}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setBagOpen(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black text-[#2a1503]"
            style={{ background: 'linear-gradient(135deg,#f4d03f,#c5a574 70%,#a07a3a)' }}
          >
            <Briefcase className="h-4 w-4" /> VIP Çantam
          </button>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-black/95 px-4 py-2.5 text-center text-[11.5px] font-black tracking-wide text-white">
        {owned
          ? `VIP${myLevel} aktif · ${cosmetics.filter((item) => item.active).length}/${cosmetics.length} ürün açık`
          : 'VIP5 ile rozet, çerçeve, mikrofon dalgası ve oda koltuğu açılır'}
      </div>

      <VipBagPanel open={bagOpen} onClose={() => setBagOpen(false)} />
    </div>
  );
}