import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LevelHeroOrb from '@/components/level/LevelHeroOrb';
import LevelTierLadder from '@/components/level/LevelTierLadder';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { giftLevelOf, giftNextThreshold } from '@/lib/userLevels';
import { formatXp } from '@/lib/xp';

const TIERS = [
  { range: '1-9', value: 1, tone: '#c98d6b', text: '#3a1c08' },
  { range: '10-19', value: 10, tone: '#9be3b4', text: '#0d2a18' },
  { range: '20-29', value: 20, tone: '#9fd6f5', text: '#0a2334' },
  { range: '30-39', value: 30, tone: '#f4d03f', text: '#3a2a02' },
  { range: '40-49', value: 40, tone: '#8ee08a', text: '#123211' },
  { range: '50-59', value: 50, tone: '#c9b8ff', text: '#231a45' },
];

// Seviye artışı kademelidir: her yeni seviye bir öncekinden daha fazla deneyim puanı ister.
const BASE_STEP = 20000;
const STEP_GROWTH = 5000;
const needFor = (level) => BASE_STEP + (level - 1) * STEP_GROWTH;
const levelInfo = (score) => {
  let level = 1;
  let into = Math.max(0, Number(score) || 0);
  while (level < 200 && into >= needFor(level)) {
    into -= needFor(level);
    level += 1;
  }
  return { level, into, need: needFor(level) };
};
const tierFor = (level) => TIERS[Math.min(TIERS.length - 1, Math.floor((level - 1) / 10))];

const TAB_ON = { color: '#ffd76a', borderBottom: '2px solid #ffd76a' };

/** Seviye sayfası: Zenginlik ve Cazibe sekmeleri, seviye ilerlemesi ve sembol tablosu. */
export default function LevelPage() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [tab, setTab] = useState('wealth');

  // Atış: gönderilen hediye K toplamı; Alış: alınan hediye K toplamı. Odada hediye gönderildikçe yükselir.
  const isWealth = tab === 'wealth';
  const k = Math.max(0, Number(isWealth ? user?.gift_sent_k : user?.gift_received_k) || 0);
  const level = giftLevelOf(k);
  const start = level > 0 ? giftNextThreshold(level - 1) : 0;
  const nextAt = giftNextThreshold(level);
  const into = Math.max(0, Math.floor(k - start));
  const need = Math.max(1, Math.ceil(nextAt - start));
  const percent = Math.min(100, Math.round((into / need) * 100));
  const remaining = Math.max(0, need - into);
  const tier = tierFor(level);
  const avatar = user?.avatar;
  const label = user?.username || user?.full_name || 'Profilim';

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/profil');
  };

  return (
    <div
      className="dark min-h-screen text-white"
      style={{ background: 'radial-gradient(130% 70% at 50% 0%, #2a1148 0%, #150a26 46%, #070311 100%)' }}
    >
      <header className="sticky top-0 z-10 flex items-center gap-2 bg-[#0d0618]/90 px-3 py-3 backdrop-blur">
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-6">
          {[
            { key: 'wealth', label: 'Atış' },
            { key: 'charm', label: 'Alış' },
          ].map((item) => {
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className="pb-1 text-sm font-black transition"
                style={active ? TAB_ON : { color: 'rgba(255,255,255,0.5)' }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-lg">
        <div className="rounded-[28px] border border-white/10 px-4 pb-5 pt-6"
          style={{ background: 'radial-gradient(circle at 50% 0%, rgba(167,139,250,.28), rgba(20,10,38,.85) 70%)', boxShadow: '0 20px 50px -25px #a78bfa' }}>
          <LevelHeroOrb avatar={avatar} label={label} level={level} percent={percent} tone={tier.tone} />
          <p className="mt-5 text-center text-sm font-black">{label}</p>
          <p className="text-center text-[10px] font-bold uppercase tracking-[.3em] text-white/45">{isWealth ? 'Atış Seviyesi' : 'Alış Seviyesi'}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[['Toplanan', formatXp(into)], ['Hedef', formatXp(need)], ['İlerleme', `${percent}%`]].map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-white/10 bg-white/5 py-2">
                <p className="text-[9px] font-bold uppercase tracking-widest text-white/45">{k}</p>
                <p className="text-sm font-black tabular-nums text-[#ffd76a]">{v}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[11.5px] font-semibold text-white/70">
          LV{level + 1} seviyesine geçmek için {formatXp(remaining)} deneyim puanı gerekiyor.
        </p>
        <p className="mt-1 text-center text-[10.5px] font-semibold text-white/40">
          {isWealth ? 'Odada hediye gönderdikçe Atış seviyen yükselir.' : 'Odada sana hediye gönderildikçe Alış seviyen yükselir.'}
        </p>

        <div className="mt-5 rounded-2xl border p-4" style={{ borderColor: 'rgba(255,215,106,0.3)', background: 'rgba(46,26,71,0.55)' }}>
          <h2 className="text-sm font-black text-white">Seviye Açıklaması</h2>
          <p className="mt-1.5 text-[11.5px] font-medium leading-5 text-white/70">
            {isWealth
              ? 'Her Atış seviyesinin kendine özgü renk simgesi vardır. Odada hediye göndererek, hediye değeri kadar Atış puanı kazanır ve Atış seviyeni yükseltirsin.'
              : 'Her Alış seviyesinin kendine özgü renk simgesi vardır. Odada hediye aldıkça Alış puanı kazanır ve Alış seviyeni yükseltirsin.'}
          </p>
        </div>

        <h2 className="mb-2 mt-5 text-xs font-black uppercase tracking-[.25em] text-white/60">Seviye Sembolleri</h2>
        <LevelTierLadder tiers={TIERS} level={level} wealth={isWealth} />
      </div>
    </div>
  );
}