import { Gift } from 'lucide-react';
import { Image } from '@/components/ui/image';

const CARD_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/bb6785261_IMG_0067.jpg';

// Görselin üzerindeki dokunma alanları (yüzde: sol, üst, genişlik, yükseklik).
const ZONES = [
  ['mic', 10, 55, 25.5, 8.5], ['stand', 37, 55, 26, 8.5], ['lock', 64.5, 55, 25.5, 8.5],
  ['follow', 8, 88, 16, 10], ['chat', 31, 88, 16, 10], ['mention', 54, 88, 16, 10], ['gift', 76, 88, 16, 10],
];

export default function ImageProfileCard({ name, avatar, likes, nLevel, vipLevel, joinDate, actions, followNode, self }) {
  const zones = self
    ? ZONES.filter(([key]) => key === 'mic' || key === 'stand' || key === 'lock')
    : ZONES.filter(([key]) => !(key === 'follow' && followNode));

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

      {/* Seviye şeridi: görseldeki sabit değerlerin üzerine gerçek veriler yazılır */}
      <div className="absolute flex items-center justify-around rounded-full bg-[#0a1638] font-black" style={{ left: '6%', top: '39.4%', width: '88%', height: '6.4%', fontSize: 'clamp(11px,3.4vw,15px)' }}>
        <span className="text-[#8fb8ff]">♥ {likes}</span>
        <span className="text-[#f2ce6b]">N{nLevel}</span>
        <span className="text-[#c3a6ff]">VIP{vipLevel}</span>
      </div>
      <div className="absolute flex items-center justify-center rounded-full bg-[#0a1638]" style={{ left: '10%', top: '48.4%', width: '80%', height: '5.4%' }}>
        <span className="font-bold text-[#cfe0ff]" style={{ fontSize: 'clamp(10px,3vw,13px)' }}>{joinDate || '-'}</span>
      </div>

      {self && (
        <>
          <div className="absolute rounded-2xl bg-[#0a1638]" style={{ left: '5%', top: '86.5%', width: '90%', height: '13%' }} />
          <button
            type="button"
            onClick={actions.gift}
            aria-label="Hediye gönder"
            className="absolute flex items-center justify-center rounded-full border border-[#f5c76b]/70 bg-[#2a1b46]/80 text-[#ffd98a] active:scale-95"
            style={{ left: '41%', top: '88%', width: '18%', aspectRatio: '1' }}
          >
            <Gift className="h-1/2 w-1/2" />
          </button>
        </>
      )}

      {!self && followNode && (
        <div className="absolute overflow-hidden opacity-0 [&>*]:h-full [&>*]:w-full" style={{ left: '8%', top: '88%', width: '16%', height: '10%' }}>{followNode}</div>
      )}

      {zones.map(([key, l, t, w, h]) => (
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