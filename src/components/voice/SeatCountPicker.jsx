import { Check, Lock, Plus } from 'lucide-react';
import { SEAT_OPTIONS, seatRows } from '@/components/voice/seatLayout';

/**
 * Koltuk kapasitesi seçimi — her kart seçilen düzeni küçük koltuk
 * noktalarıyla önizler, seçili kart yeşil onay işaretiyle işaretlenir.
 * `allowed` verilirse yalnızca o düzenler seçilebilir; diğerleri kilitli görünür.
 */
export default function SeatCountPicker({ value, onChange, compact = false, allowed = null, onBlocked }) {
  return (
    <div className={`grid grid-cols-3 ${compact ? 'gap-2' : 'gap-2.5'}`}>
      {SEAT_OPTIONS.map((count) => {
        const active = Number(value) === count;
        const blocked = Array.isArray(allowed) && !allowed.includes(count);
        const dot = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';
        const icon = compact ? 'h-2 w-2' : 'h-2.5 w-2.5';
        return (
          <button
            key={count}
            type="button"
            onClick={() => (blocked ? onBlocked?.(count) : onChange(count))}
            aria-pressed={active}
            aria-disabled={blocked}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border p-2.5 transition-all active:scale-95 ${
              blocked
                ? 'border-white/5 bg-[#101017] opacity-45'
                : active
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-white/10 bg-[#15151d]'
            }`}
          >
            <div className={`flex flex-col items-center ${compact ? 'gap-0.5' : 'gap-1'} py-1`}>
              {seatRows(count).map((size, rowIndex) => (
                <div key={rowIndex} className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
                  {Array.from({ length: size }).map((_, i) => (
                    <span key={i} className={`flex ${dot} items-center justify-center rounded-full border border-white/20 bg-black/50`}>
                      <Plus className={`${icon} text-white/80`} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <span className={`text-[11px] font-semibold ${blocked ? 'text-gray-500' : active ? 'text-green-400' : 'text-gray-300'}`}>{count} Mikrofon</span>
            {active && !blocked && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                <Check className="h-3 w-3 text-white" />
              </span>
            )}
            {blocked && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
                <Lock className="h-3 w-3 text-white/70" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}