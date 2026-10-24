import { useEffect, useState } from 'react';

const ART = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/870a8d3b3_9D2B8F70-0F1B-4A06-A404-7E7D81F994CB.jpg';

// Görseldeki beyaz zemin tarayıcıda şeffaflaştırılır: tasarım odanın temasının üstünde PNG gibi durur.
function useTransparentArt() {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        const min = Math.min(px[i], px[i + 1], px[i + 2]);
        if (min > 235) px[i + 3] = 0;
        else if (min > 200) px[i + 3] = Math.round(((235 - min) / 35) * 255);
      }
      ctx.putImageData(data, 0, 0);
      setSrc(canvas.toDataURL('image/png'));
    };
    img.src = ART;
  }, []);
  return src;
}

const SPOTS = [
  { key: 'profile', label: 'Oda bilgisi', style: { left: '1%', top: '0%', width: '58%', height: '68%' } },
  { key: 'gifts', label: 'Hediye puanı', style: { left: '1%', top: '68%', width: '20%', height: '30%' } },
  { key: 'viewers', label: 'Odadakiler', style: { left: '61%', top: '15%', width: '11%', height: '60%' } },
  { key: 'menu', label: 'Oda menüsü', style: { left: '74%', top: '15%', width: '12%', height: '60%' } },
  { key: 'exit', label: 'Odadan çık', style: { left: '88%', top: '15%', width: '12%', height: '60%' } },
];

/** Sesli odanın üst bölümü: gönderilen tasarım görseli ve üstüne yerleşen görünmez dokunma alanları. */
export default function VoiceRoomHeaderArt({ room, viewerCount = 0, onProfile, onGifts, onViewers, onMenu, onExit }) {
  const roomId = room?.room_number || room?.personal_room_code || '';
  const src = useTransparentArt();
  const actions = { profile: onProfile, gifts: onGifts, viewers: onViewers, menu: onMenu, exit: onExit };
  return (
    <div className="relative w-full" style={{ aspectRatio: '1024 / 307' }}>
      {src && <img src={src} alt="" className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" draggable={false} />}
      {SPOTS.map((spot) => (
        <button key={spot.key} type="button" aria-label={spot.label} onClick={actions[spot.key]} className="absolute rounded-full active:bg-white/10" style={spot.style} />
      ))}
      <button type="button" aria-label="Oda profili" onClick={onProfile} className="absolute overflow-hidden rounded-full" style={{ left: '3%', top: '10%', width: '15%', aspectRatio: '1 / 1' }}>
        {room?.cover_url && <img src={room.cover_url} alt="" className="h-full w-full object-cover" />}
      </button>
      <button type="button" onClick={onProfile} className="absolute flex flex-col justify-center overflow-hidden rounded-md bg-black/85 px-1.5 text-left" style={{ left: '20%', top: '16%', width: '36%', height: '38%' }}>
        <span className="truncate text-[13px] font-bold leading-tight text-white">{room?.name}</span>
        <span className="truncate text-[10px] leading-tight text-white/80">ID:{roomId}</span>
      </button>
      <span className="pointer-events-none absolute flex items-center justify-center rounded bg-[#1b1430] text-[11px] font-bold text-white" style={{ left: '64%', top: '32%', width: '6%', height: '24%' }}>{viewerCount}</span>
    </div>
  );
}