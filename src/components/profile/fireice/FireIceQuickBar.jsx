import { Mic, ScrollText, User } from 'lucide-react';

const PILL = 'fi-frame fi-tile flex items-center justify-center gap-1.5 rounded-2xl px-2 py-2.5 text-[11px] font-black text-white active:scale-95';

/** Avatarın altındaki iki kısa düğme ve tek satırlık tam genişlik düğme. */
export default function FireIceQuickBar({ onInfo, onSettings, onActivity }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onInfo} className={PILL}>
          <User className="h-4 w-4 text-[#ffd166]" />
          Kişisel Bilgiler
        </button>
        <button type="button" onClick={onSettings} className={PILL}>
          <Mic className="h-4 w-4 text-[#ffd166]" />
          Ses ve Mikrofon
        </button>
      </div>
      <button type="button" onClick={onActivity} className={`${PILL} w-full justify-start gap-2 px-3`}>
        <ScrollText className="h-4 w-4 text-[#ffd166]" />
        Hesap Hareketleri
      </button>
    </div>
  );
}