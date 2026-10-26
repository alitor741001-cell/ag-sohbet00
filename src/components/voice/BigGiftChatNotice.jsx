import { ChevronRight, Rocket } from 'lucide-react';
import { formatScore } from '@/components/voice/scoreTier';

/** Sohbetin altındaki büyük hediye satırı: basılınca hediye atan kişinin odasına gidilir. */
export default function BigGiftChatNotice({ notice, onOpen }) {
  if (!notice) return null;
  const rocket = notice.kind === 'rocket';

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-300/10 px-3 py-2 text-left transition-transform active:scale-[0.98]"
    >
      <span className="text-lg leading-none">{rocket ? <Rocket className="h-5 w-5 text-slot-gold" /> : notice.gift_emoji || '🎁'}</span>
      <span className="min-w-0 flex-1">
        <span className={rocket ? 'block break-words text-[12px] font-bold text-amber-100' : 'block truncate text-[12px] font-bold text-amber-100'}>
          {rocket ? `${notice.sender_name || 'Kullanıcı'} Az önce ${notice.recipient_name || notice.room_name}’in odasında ${notice.rocket_level}LVL başarıyla 1 roket patlattı` : <>{notice.sender_name || 'Kullanıcı'}, {notice.room_name ? `${notice.room_name} odasında ` : ''}{formatScore(notice.score || 0)} hediye attı</>}
        </span>
        <span className="block text-[10px] font-semibold text-amber-300/90">{rocket ? 'Gel ve izle' : 'İzlemek için tıkla'}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-amber-200" />
    </button>
  );
}