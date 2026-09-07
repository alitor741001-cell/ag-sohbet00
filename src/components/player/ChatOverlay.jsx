import { useState } from 'react';
import { MessageSquare, X, Send } from 'lucide-react';

export default function ChatOverlay({ messages, onSend, user }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center shadow-lg lg:hidden">
        <MessageSquare className="w-5 h-5 text-white" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md h-[60vh] flex flex-col bg-card border border-border rounded-t-2xl lg:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-semibold text-white">Sohbet</h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-5 h-5 text-white" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages?.map((m) => (
                <div key={m.id} className={`flex ${m.user_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3 py-1.5 ${m.user_id === user?.id ? 'bg-purple-600 text-white' : 'bg-white/10 text-white'}`}>
                    {m.user_id !== user?.id && <p className="text-xs font-semibold text-purple-300">{m.user_name}</p>}
                    <p className="text-sm">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-border flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Mesaj..." className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-white" />
              <button onClick={send} className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center"><Send className="w-4 h-4 text-white" /></button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}