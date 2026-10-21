import { Check } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { ROOM_BACKGROUNDS } from '@/lib/roomBackgrounds';

/** Oda teması seçici: her tema gerçek bir görselle temsil edilir. */
export default function VoiceRoomThemePanel({ value, onPick }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#FFD700]/45 bg-black/70 p-3 shadow-[0_0_18px_-8px_rgba(255,215,0,0.9)]">
      <p className="mb-2 text-[11px] font-black tracking-[0.12em] text-[#FFD700]">ODA TEMALARI</p>
      <div className="grid grid-cols-3 gap-2">
        {ROOM_BACKGROUNDS.map((item) => {
          const active = item.key === value;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onPick(item.key)}
              aria-pressed={active}
              className="relative overflow-hidden rounded-xl active:scale-95"
              style={{ boxShadow: active ? '0 0 0 2px #FFD700, 0 0 14px -2px rgba(255,215,0,0.8)' : '0 0 0 1px rgba(255,255,255,0.12)' }}
            >
              <Image src={item.image} alt={item.label} fittingType="fill" className="h-20 w-full" />
              <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[9px] font-bold text-white">{item.label}</span>
              {active && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD700]">
                  <Check className="h-3 w-3 text-black" />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-white/45">Seçtiğin tema odadaki herkesin ekranında anında değişir.</p>
    </div>
  );
}