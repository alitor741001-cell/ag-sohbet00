import { ArrowUpDown, Gift, Megaphone, Sparkles, X } from 'lucide-react';
import NoiseSuppressionSetting from '@/components/voice/NoiseSuppressionSetting';

/** Tek ayar satırı: solda simge, ortada başlık ve açıklama, sağda açma/kapama anahtarı. */
function ToggleRow({ icon: Icon, title, hint, enabled, onToggle, disabled = false, busy = false }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!enabled)}
      aria-pressed={enabled}
      aria-busy={busy}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#F2CE6B]/25 bg-black/30 px-3 py-2.5 text-left disabled:opacity-50"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${enabled ? 'bg-gradient-to-br from-[#F2CE6B] to-[#ef4444] text-black' : 'bg-white/10 text-[#F2CE6B]'}`}>
        <Icon className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#F6E2A8]">{title}</span>
        {hint && <span className="block text-[11px] text-[#F6E2A8]/60">{hint}</span>}
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? 'bg-[#ef4444]' : 'bg-white/15'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#F2CE6B] transition-all ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

/** Oda ayarları: ekranın dibinden altın-kırmızı kart olarak açılır. */
export default function GiftEffectsSheet({ open, onClose, enabled, onToggle, swipeEnabled, onToggleSwipe, onAgencyCall }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[255] flex flex-col justify-end">
      <button type="button" aria-label="Kapat" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-sheet-up relative w-full overflow-hidden rounded-t-[26px] bg-gradient-to-b from-[#4A3410] via-[#3A1E14] to-[#1D1815] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 ring-1 ring-[#F2CE6B]/40">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#F2CE6B] via-[#ef4444] to-[#F2CE6B]" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-bold text-[#F2CE6B]">
            <Sparkles className="h-4 w-4 text-[#ef4444]" /> Oda ayarları
          </p>
          <button type="button" onClick={onClose} aria-label="Kapat" className="rounded-full p-1.5 text-[#F2CE6B] transition-colors hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <ToggleRow
            icon={Gift}
            title="Hediye efektleri"
            hint={enabled ? 'Atılan hediyelerin görselleri ekranda oynar.' : 'Atılan hediyelerin görselleri gösterilmez.'}
            enabled={enabled}
            onToggle={onToggle}
          />
          <ToggleRow
            icon={ArrowUpDown}
            title="Yukarı/aşağı kaydırma"
            hint={swipeEnabled
              ? 'Koltukta değilken kaydırarak diğer canlı odalara geçilir.'
              : 'Kapalı — kaydırma yayın değiştirmez.'}
            enabled={swipeEnabled}
            onToggle={onToggleSwipe}
          />
          {onAgencyCall && (
            <button type="button" onClick={() => { onClose(); onAgencyCall(); }} className="flex w-full items-center gap-3 rounded-2xl border border-[#F2CE6B]/25 bg-black/30 px-3 py-2.5 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F2CE6B] to-[#ef4444] text-black"><Megaphone className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#F6E2A8]">Ajans Çağrısı</span>
                <span className="block text-[11px] text-[#F6E2A8]/60">Herkesi bu odaya davet et.</span>
              </span>
            </button>
          )}
          <NoiseSuppressionSetting Row={ToggleRow} />
        </div>
      </div>
    </div>
  );
}