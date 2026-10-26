import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import SupportAttachment from '@/components/support/SupportAttachment';
import ProfileModeration from '@/components/profile/ProfileModeration';
import { Link } from 'react-router-dom';
const call = async payload => (await base44.functions.invoke('officialSupport', payload)).data;
export default function OfficialThread({ ticket, onClosed }) {
  const [text, setText] = useState(''), [confirm, setConfirm] = useState(false);
  const client = useQueryClient();
  const messages = useInfiniteQuery({ queryKey: ['official-messages', ticket.id], initialPageParam: undefined,
    queryFn: ({ pageParam }) => call({ action: 'messages', ticket_id: ticket.id, cursor: pageParam }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, refetchInterval: 3000 });
  const mutation = useMutation({ mutationFn: action => call({ action, ticket_id: ticket.id, text }),
    onSuccess: (_, action) => { setText(''); client.invalidateQueries({ queryKey: ['official-tickets'] }); client.invalidateQueries({ queryKey: ['official-messages', ticket.id] }); if (action === 'close') onClosed(); } });
  return <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
    <header className="space-y-2 border-b border-border p-3"><Link to={`/kullanici/${ticket.user_id}`} className="font-bold text-primary">{ticket.user_name || 'Kullanıcı'}</Link><p className="text-xs text-muted-foreground">{ticket.subject}</p>
      <button disabled={mutation.isPending} onClick={() => setConfirm(!confirm)} className="text-xs font-bold text-destructive">Görüşmeyi kapat</button>
      {confirm && <div className="text-xs">Görüşme ve mesajlar silinsin mi? <button disabled={mutation.isPending} onClick={() => mutation.mutate('close')} className="ml-2 font-bold text-destructive">Evet, kapat</button></div>}
    </header>
    <div className="flex-1 space-y-2 overflow-y-auto p-3" aria-live="polite">
      {messages.isPending && <p>Yükleniyor...</p>}{messages.isError && <p role="alert" className="text-destructive">Mesajlar alınamadı.</p>}
      {messages.hasNextPage && <button onClick={() => messages.fetchNextPage()} disabled={messages.isFetchingNextPage} className="text-xs text-primary">Eski mesajları yükle</button>}
      {messages.data?.pages.flatMap(page => page.items).reverse().map(message => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.sender === 'admin' ? 'ml-8 bg-primary text-primary-foreground' : 'mr-8 bg-secondary'}`}><SupportAttachment message={message} className="max-h-48 max-w-full rounded-lg" /><p className="whitespace-pre-wrap break-words">{message.text}</p></div>)}
    </div>
    <form className="flex gap-2 border-t border-border p-3" onSubmit={e => { e.preventDefault(); mutation.mutate('reply'); }}><input maxLength={2000} value={text} onChange={e => setText(e.target.value)} placeholder="Cevap yazın..." className="min-w-0 flex-1 rounded-lg bg-secondary p-2 text-base" /><button disabled={mutation.isPending || !text.trim()} className="rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground disabled:opacity-50">Gönder</button></form>
    {mutation.isError && <p role="alert" className="p-2 text-xs text-destructive">{mutation.error.response?.data?.error || 'İşlem tamamlanamadı.'}</p>}
  </div>;
}