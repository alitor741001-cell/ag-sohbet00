import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

/** Gündüz tartışması: sohbet. Ölüler takip edebilir ama yazamaz. */
export default function MafyaDayPanel({ chat, me, busy, onSend }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const dead = me ? !me.alive : true;

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [chat]);

  const send = () => {
    const value = text.trim();
    if (!value) return;
    setText('');
    onSend(value);
  };

  return (
    <div className="mf-panel">
      <p className="mf-panel-title">GÜNDÜZ TARTIŞMA</p>
      <div className="mf-chat" ref={listRef}>
        {chat.map((message) => (
          <div className={`mf-msg${message.type === 'system' ? ' mf-msg-system' : ''}`} key={message.id}>
            {message.type === 'system' ? null : <p className="mf-msg-name">{message.name}</p>}
            <p className="mf-msg-text">{message.text}</p>
          </div>
        ))}
        {!chat.length ? (
          <p className="mf-panel-text">Henüz mesaj yok. Şüphelini söyle, tartışmayı sen başlat.</p>
        ) : null}
      </div>
      <div className="mf-composer">
        <input
          className="mf-input"
          value={text}
          maxLength={240}
          placeholder={dead ? 'Ölüler konuşamaz' : 'Şüphelini yaz...'}
          disabled={dead}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
        />
        <button type="button" className="mf-send" aria-label="Gönder" disabled={dead || busy} onClick={send}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}