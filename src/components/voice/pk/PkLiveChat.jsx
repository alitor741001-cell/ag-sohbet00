import { useEffect, useRef } from 'react';

/** PK ekranındaki canlı yorum akışı: odanın mevcut sohbetinden beslenir. */
export default function PkLiveChat({ messages = [], user }) {
  const boxRef = useRef(null);
  const list = messages.filter((message) => message.type !== 'gift').slice(-40);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [list.length]);

  return (
    <div ref={boxRef} className="h-[17vh] min-h-[3.5rem] space-y-1 overflow-y-auto py-1">
      {list.length === 0 && (
        <p className="px-1 py-2 text-[10.5px] text-white/40">İlk yorumu sen yaz, yayıncıya destek ol.</p>
      )}
      {list.map((message) => (
        <div key={message.id} className="flex items-start gap-1.5 px-1">
          {message.user_avatar
            ? <img src={message.user_avatar} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-full object-cover" />
            : <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-white/15" />}
          <p className="min-w-0 flex-1 text-[11px] leading-snug text-white">
            <span className={`font-black ${message.user_id === user?.id ? 'text-[#25f4ee]' : 'text-white/60'}`}>
              {message.user_name || 'Kullanıcı'}
            </span>{' '}
            {message.text}
          </p>
        </div>
      ))}
    </div>
  );
}