import { Settings, ShieldCheck, UserX } from 'lucide-react';
import DragonHead from '@/components/profile/fireice/DragonHead';

const BUTTON = 'relative flex h-11 w-11 items-center justify-center rounded-full border border-[#2ee6ff]/40 bg-[#0a1020]/80 text-white active:scale-95';

/** Alt bar: iki köşede ejderha başları, ortada üç yuvarlak kısayol. */
export default function FireIceFooter({ onBlocked, onPrivacy, onSettings }) {
  return (
    <div className="relative mt-1 flex items-center justify-center">
      <DragonHead className="fi-dragon pointer-events-none absolute -left-1 top-1/2 h-9 w-9 -translate-y-1/2 -scale-x-100" variant="ice" />
      <div
        className="flex items-center gap-4 rounded-full px-5 py-2"
        style={{
          border: '1px solid transparent',
          backgroundImage: 'linear-gradient(180deg, rgba(10,16,32,0.9), rgba(4,7,18,0.92)), linear-gradient(128deg, #ff5a00, #ffe6a6 35%, #2ee6ff 65%, #0069ff)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          boxShadow: '0 0 14px rgba(0,122,255,0.35), 0 0 12px rgba(255,90,0,0.22)',
        }}
      >
        <button type="button" onClick={onBlocked} aria-label="Engellenen hesaplar" className={BUTTON}>
          <UserX className="h-5 w-5 text-[#ff9a9a]" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#e11d2e] text-[8px] font-black text-white">✕</span>
        </button>
        <button type="button" onClick={onPrivacy} aria-label="Gizlilik ve güvenlik" className={BUTTON}>
          <ShieldCheck className="h-5 w-5 text-[#8ef4c0]" />
        </button>
        <button type="button" onClick={onSettings} aria-label="Ayarlar" className={BUTTON}>
          <Settings className="h-5 w-5 text-[#c9e9ff]" />
        </button>
      </div>
      <DragonHead className="fi-dragon pointer-events-none absolute -right-1 top-1/2 h-9 w-9 -translate-y-1/2" variant="fire" />
    </div>
  );
}