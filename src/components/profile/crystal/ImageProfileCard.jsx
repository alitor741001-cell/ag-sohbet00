import { Lock } from 'lucide-react';
import { Image } from '@/components/ui/image';

const CARD_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/bb6785261_IMG_0067.jpg';

// Görsel üzerindeki dokunma alanları (yüzde: sol, üst, genişlik, yükseklik).
const ZONES = [
  ['follow', 8, 88, 16, 10], ['chat', 31, 88, 16, 10], ['mention', 54, 88, 16, 10], ['gift', 76, 88, 16, 10],
];

const TOP = [
  ['mic', 10, 55, 25.5, 8.5], ['stand', 37, 55, 26, 8.5],
];

export default function ImageProfileCard({ name, avatar, likes, nLevel, vipLevel, joinDate, actions, followNode }) {
  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '682 / 1024' }}>
      <img src={CARD_URL} alt="" className="absolute inset-0 h-full w-full rounded-2xl object-cover" draggable={false} />

      <div className="absolute overflow-hidden rounded-full bg-[#0a1638]" style={{ left: '36.6%', top: '4.3%', width: '26.8%', aspectRatio: '1' }}>
        {avatar
          ? <Image src={avatar} alt="" className="h-full w-full" fittingType="fill" />
          : <span className="flex h-full w-full items-center justify-center text-3xl font-black">{(name || '?')[0]}</span>}
      </div>

      <div className="absolute flex items-center justify-center rounded-lg bg-[#071233]" style={{ left: '31%', top: '30.3%', width: '38%', height: '6.4%' }}>
        <span className="truncate px-1 font-serif text-[clamp(18px,7vw,30px)] tracking-wide text-[#e6eeff] [text-shadow:0_0_10px_#4d8bff]">{name}</span>
      </div>

      <span className="absolute flex items-center justify-center rounded bg-[#1d4fd8] text-[clamp(11px,3.6vw,16px)] font-black text-white" style={{ left: '27%', top: '40.8%', width: '8%', height: '3.6%' }}>{likes}</span>
      <span className="absolute flex items-center justify-center rounded bg-[#151512] text-[clamp(11px,3.6vw,16px)] font-black text-[#f2ce6b]" style={{ left: '48.5%', top: '40.8%', width: '11%', height: '3.6%' }}>N{nLevel}</span>
      <span className="absolute flex items-center justify-center rounded bg-[#3a1786] text-[clamp(11px,3.6vw,16px)] font-black text-white" style={{ left: '72%', top: '40.8%', width: '10.5%', height: '3.6%' }}>VIP{vipLevel}</span>
      <span className="absolute flex items-center justify-end rounded bg-[#0a1a45] pr-1 text-[clamp(11px,3.6vw,16px)] font-black text-white" style={{ left: '62%', top: '49.6%', width: '24%', height: '3.4%' }}>{joinDate || '-'}</span>

      {/* Kaldırılan yazı satırlarının üzerini kapatır */}
      <div className="absolute rounded-2xl bg-[#0a1638]" style={{ left: '5%', top: '64%', width: '90%', height: '23%' }} />

      {TOP.map(([key, l, t, w, h]) => (
        <button
          key={key}
          type="button"
          aria-label={key}
          onClick={actions[key]}
          className="absolute rounded-xl active:bg-white/15"
          style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}
        />
      ))}

      <button
        type="button"
        onClick={actions.lock}
        className="absolute flex items-center justify-center gap-1 rounded-xl border border-[#4f7fd4]/70 bg-[#12234f] font-bold text-[#dfe9ff] active:bg-[#1a2f66]"
        style={{ left: '64.5%', top: '55%', width: '25.5%', height: '8.5%', fontSize: 'clamp(9px,2.6vw,12px)' }}
      >
        <Lock className="h-3 w-3 shrink-0" /> Koltuğu Kilitle
      </button>

      {followNode && (
        <div className="absolute overflow-hidden opacity-0 [&>*]:h-full [&>*]:w-full" style={{ left: '8%', top: '88%', width: '16%', height: '10%' }}>{followNode}</div>
      )}

      {ZONES.filter(([key]) => !(key === 'follow' && followNode)).map(([key, l, t, w, h]) => (
        <button
          key={key}
          type="button"
          aria-label={key}
          onClick={actions[key]}
          className="absolute rounded-xl active:bg-white/15"
          style={{ left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%` }}
        />
      ))}
    </div>
  );
}