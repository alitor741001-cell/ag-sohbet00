import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

/** PK yorum alanı: odanın sohbeti canlı akar, alttaki kutudan yorum yazılır. */
export default function PkComments({ messages = [], user, onSend, disabled }) {
  const [text, setText] = useState('');
  const boxRef = useRef(null);
  const list = messages.filter((message) => message.type !== 'gift').slice(-40);

  useEffect(() => {
    const box = boxRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [list.length]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    onSend?.(value);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.04]">
      <p className="shrink-0 px-2.5 pt-1.5 text-[10px] font-black uppercase tracking-wide text-white/45">Yorumlar</p>
      <div ref={boxRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2.5 py-1.5">
        {list.length === 0 && <p className="py-3 text-center text-[11px] text-white/35">İlk yorumu sen yaz.</p>}
        {list.map((message) => (
          <div key={message.id} className="flex items-start gap-1.5">
            {message.user_avatar
              ? <img src={message.user_avatar} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-full object-cover" />
              : <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-white/15" />}
            <p className="min-w-0 flex-1 text-[11.5px] leading-snug text-white/85">
              <span className={`font-black ${message.user_id === user?.id ? 'text-emerald-300' : 'text-fuchsia-300'}`}>
                {message.user_name || 'Kullanıcı'}:
              </span>{' '}
              {message.text}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 border-t border-white/10 p-1.5">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={disabled}
          placeholder="Yorum yaz…"
          className="h-9 min-w-0 flex-1 rounded-full bg-white/10 px-3 text-[12px] text-white outline-none placeholder:text-white/35 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          aria-label="Yorumu gönder"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuchsia-500 text-white active:scale-95 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}