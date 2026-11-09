import { useEffect, useMemo, useRef } from 'react';
import UserBadgeRow from '@/components/status/UserBadgeRow';
import useMessageProfiles from '@/hooks/useMessageProfiles';

/**
 * PK ekranındaki canlı yorum akışı: odanın mevcut sohbetinden beslenir.
 * Her yorumda yazan kişinin ismi, seviyesi, hediye seviyeleri ve VIP rozeti durur;
 * isme veya profile dokununca sesli odadaki profil kartı açılır.
 */
export default function PkLiveChat({ messages = [], user, onOpenProfile }) {
  const boxRef = useRef(null);
  const list = useMemo(() => messages.filter((message) => message.type !== 'gift').slice(-40), [messages]);
  const ids = useMemo(() => [...new Set(list.map((message) => message.user_id).filter(Boolean))], [list]);
  const profiles = useMessageProfiles(ids);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [list.length]);

  return (
    <div ref={boxRef} className="h-[17vh] min-h-[3.5rem] space-y-1.5 overflow-y-auto py-1">
      {list.length === 0 && (
        <p className="px-1 py-2 text-[10.5px] text-white/40">İlk yorumu sen yaz, yayıncıya destek ol.</p>
      )}
      {list.map((message) => {
        const mine = message.user_id === user?.id;
        return (
          <div key={message.id} className="flex items-start gap-1.5 px-1">
            <button
              type="button"
              onClick={() => onOpenProfile?.(message.user_id)}
              aria-label="Profili aç"
              className="mt-0.5 h-6 w-6 shrink-0 overflow-hidden rounded-full bg-white/15 active:scale-95"
            >
              {message.user_avatar
                ? <img src={message.user_avatar} alt="" className="h-full w-full object-cover" />
                : <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white/80">{(message.user_name || '?').charAt(0)}</span>}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5">
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(message.user_id)}
                  className={`max-w-full truncate text-left text-[11px] font-black ${mine ? 'text-[#25f4ee]' : 'text-white/70'}`}
                >
                  {message.user_name || 'Kullanıcı'}
                </button>
                <UserBadgeRow profile={profiles[message.user_id]} compact />
              </div>
              <p className="text-[11px] leading-snug text-white">{message.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}