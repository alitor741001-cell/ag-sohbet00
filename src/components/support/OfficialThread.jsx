import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SupportAttachment from '@/components/support/SupportAttachment';
import SupportMemberIdentity from '@/components/support/SupportMemberIdentity';
const call = async payload => (await base44.functions.invoke('officialSupport', payload)).data;
export default function OfficialThread({ ticket, onClosed, onCloseTopic, closing }) {
  const [text, setText] = useState('');
  const client = useQueryClient();
  const messages = useInfiniteQuery({ queryKey: ['official-messages', ticket.id], initialPageParam: undefined,
    queryFn: ({ pageParam }) => call({ action: 'messages', ticket_id: ticket.id, cursor: pageParam }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, refetchInterval: 3000 });
  useEffect(() => { if ([404, 410].includes(messages.error?.response?.status)) { client.invalidateQueries({ queryKey: ['official-tickets'] }); onClosed(); } }, [messages.error, client, onClosed]);
  const mutation = useMutation({ mutationFn: () => call({ action: 'reply', ticket_id: ticket.id, text }),
    onSuccess: () => { setText(''); client.invalidateQueries({ queryKey: ['official-tickets'] }); client.invalidateQueries({ queryKey: ['official-messages', ticket.id] }); } });
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <header className="space-y-2 border-b border-border p-3"><SupportMemberIdentity ticket={ticket} onCloseTopic={onCloseTopic} /><p className="text-xs text-muted-foreground">{ticket.subject}</p>
      <button disabled={closing} onClick={onCloseTopic} className="text-xs font-bold text-destructive">{closing ? 'Kapatılıyor...' : 'Konuyu Kapat'}</button>
    </header>
    <div className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
      {messages.isPending && <p>Yükleniyor...</p>}{messages.isError && <p role="alert" className="text-destructive">Mesajlar alınamadı.</p>}
      {messages.hasNextPage && <button onClick={() => messages.fetchNextPage()} disabled={messages.isFetchingNextPage} className="text-xs text-primary">Eski mesajları yükle</button>}
      {messages.data?.pages.flatMap(page => page.items).reverse().map(message => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.sender === 'admin' ? 'ml-8 bg-primary text-primary-foreground' : 'mr-8 bg-secondary'}`}><SupportAttachment message={message} className="max-h-48 max-w-full rounded-lg" /><p className="whitespace-pre-wrap break-words">{message.text}</p></div>)}
    </div>
    <form className="flex gap-2 border-t border-border p-3" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}><input maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder="Cevap yazın..." className="min-w-0 flex-1 rounded-lg bg-secondary p-2 text-base" /><button disabled={mutation.isPending || !text.trim()} className="rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-50">Gönder</button></form>
    {mutation.isError && <p role="alert" className="p-2 text-xs text-destructive">{mutation.error.response?.data?.error || 'İşlem tamamlanamadı.'}</p>}
  </div>;
}