import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { plainText } from '@/components/voice/voiceText';

/** Sesli oda sohbet akışı — mesajlar en altta, giriş/çıkış bildirimleri sohbet içinde. */
export default function VoiceChat({ messages = [], onSend, currentUserId, className = '' }) {
  const [text, setText] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const submit = (event) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    onSend(value);
  };

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
        {messages.length === 0 && <p className="py-6 text-center text-xs text-white/40">Henüz mesaj yok.</p>}
        {messages.map((message) => {
          if (message.type === 'system') {
            return <p key={message.id} className="text-center text-[11px] text-white/50">{plainText(message.text)}</p>;
          }
          const own = message.user_id === currentUserId;
          return (
            <div key={message.id} className="flex items-start gap-2">
              {message.user_avatar
                ? <Image src={message.user_avatar} alt={message.user_name} className="h-8 w-8 shrink-0 rounded-full overflow-hidden" fittingType="fill" />
                : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-white">{(message.user_name || '?')[0]}</span>}
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-semibold ${own ? 'text-green-400' : 'text-white/70'}`}>{message.user_name}{own && ' (Sen)'}</p>
                <p className="break-words rounded-2xl bg-white/10 px-3 py-1.5 text-sm text-white [overflow-wrap:anywhere]">{plainText(message.text)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Mesaj yaz..."
          className="h-10 min-w-0 flex-1 rounded-full bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/40"
        />
        <button type="submit" aria-label="Gönder" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}