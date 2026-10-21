import { Image } from '@/components/ui/image';

const CARD_URL = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/bb6785261_IMG_0067.jpg';

// Gönderilen görselin üzerindeki dokunma alanları (yüzde olarak: sol, üst, genişlik, yükseklik).
const ZONES = [
  ['mic', 10, 55, 25.5, 8.5], ['stand', 37, 55, 26, 8.5], ['profile', 64.5, 55, 25.5, 8.5],
  ['lock', 10, 64.5, 80, 6], ['gift', 7, 72.3, 86, 6.3], ['mention', 7, 80, 86, 6.3],
  ['follow', 8, 88, 16, 10], ['chat', 31, 88, 16, 10], ['mention2', 54, 88, 16, 10], ['gift2', 76, 88, 16, 10],
];

const mask = 'absolute flex items-center justify-center font-black text-white';

/** Sesli oda profil kartı: gönderilen görselin kendisi, üstünde kişinin bilgileri ve gerçek butonlar. */
export default function ImageProfileCard({ name, avatar, likes, nLevel, vipLevel, joinDate, actions, followNode }) {
  return (
    <div className="relative w-full select-none" style={{ aspectRatio: '682 / 1024' }}>
      <img src={CARD_URL} alt="" className="absolute inset-0 h-full w-full rounded-2xl object-cover" draggable={false} />

      <div className="absolute overflow-hidden rounded-full bg-[#0a1638]" style={{ left: '36.6%', top: '4.3%', width: '26.8%', aspectRatio: '1' }}>
        {avatar
          ? <Image src={avatar} alt="" className="h-full w-full" fittingType="fill" />
          : <span className="flex h-full w-full items-center justify-center text-3xl font-black">{(name || '?')[0]}</span>}
      </div>

      <div className={`${mask} rounded-lg bg-[#071233]`} style={{ left: '31%', top: '30.3%', width: '38%', height: '6.4%' }}>
        <span className="truncate px-1 font-serif text-[clamp(18px,7vw,30px)] tracking-wide text-[#e6eeff] [text-shadow:0_0_10px_#4d8bff]">{name}</span>
      </div>

      <span className={`${mask} rounded bg-[#1d4fd8] text-[clamp(11px,3.6vw,16px)]`} style={{ left: '27%', top: '40.8%', width: '8%', height: '3.6%' }}>{likes}</span>
      <span className={`${mask} rounded bg-[#151512] text-[clamp(11px,3.6vw,16px)] text-[#f2ce6b]`} style={{ left: '48.5%', top: '40.8%', width: '11%', height: '3.6%' }}>N{nLevel}</span>
      <span className={`${mask} rounded bg-[#3a1786] text-[clamp(11px,3.6vw,16px)]`} style={{ left: '72%', top: '40.8%', width: '10.5%', height: '3.6%' }}>VIP{vipLevel}</span>
      <span className={`${mask} justify-end rounded bg-[#0a1a45] pr-1 text-[clamp(11px,3.6vw,16px)]`} style={{ left: '62%', top: '49.6%', width: '24%', height: '3.4%' }}>{joinDate || '-'}</span>

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