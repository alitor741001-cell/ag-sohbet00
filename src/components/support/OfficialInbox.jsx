import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import useChatViewport from '@/hooks/useChatViewport';
import { useCurrentUser } from '@/lib/useCurrentUser';
import SupportChatHeader from '@/components/support/SupportChatHeader';
import SupportTicketCard from '@/components/support/SupportTicketCard';
import '@/components/support/supportChat.css';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useBackDismiss from '@/hooks/useBackDismiss';
import OfficialThread from '@/components/support/OfficialThread';
const call = async payload => (await base44.functions.invoke('officialSupport', payload)).data;
export default function OfficialInbox() {
  const frame = useRef(null), searchInput = useRef(null);
  useChatViewport(frame);
  const { user } = useCurrentUser();
  const [ticket, setTicket] = useState(null);
  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(`destek-okundu:${user.id}`, new Date().toISOString());
    window.dispatchEvent(new Event('destek-goruldu'));
  }, [user?.id, ticket?.id]);
  const [input, setInput] = useState(''), [search, setSearch] = useState('');
  const navigate = useNavigate(), client = useQueryClient();
  useBackDismiss(!!ticket, () => setTicket(null));
  const query = useInfiniteQuery({ queryKey: ['official-tickets', search], initialPageParam: undefined,
    queryFn: ({ pageParam }) => call({ action: 'list', cursor: pageParam, member_id: search }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, refetchInterval: 5000 });
  const close = useMutation({ mutationFn: id => call({ action: 'close', ticket_id: id }), onSuccess: () => {
    setTicket(null); client.invalidateQueries({ queryKey: ['official-tickets'] });
  } });
  const closeTopic = async id => {
    if (!window.confirm('Konu kapatılsın mı? Mesajlar üyeden bir dakika sonra silinecek.')) return false;
    try { await close.mutateAsync(id); return true; }
    catch { return false; }
  };
  const back = () => ticket ? setTicket(null) : window.history.length > 1 ? navigate(-1) : navigate('/');
  return <main ref={frame} className="support-chat fixed inset-x-0 z-[250] flex min-h-0 flex-col overflow-hidden" style={{ top: 'var(--viewport-offset, 0px)', height: 'var(--visual-viewport-height, 100dvh)' }}>
    <SupportChatHeader onBack={back} onEnd={ticket ? () => closeTopic(ticket.id) : undefined} closing={close.isPending} onSearch={!ticket ? () => searchInput.current?.focus() : undefined} />
    {close.isError && <p role="alert" className="px-4 py-2 text-sm text-destructive">{close.error.response?.data?.error || 'Görüşme sonlandırılamadı.'}</p>}
    {ticket ? <OfficialThread key={ticket.id} ticket={ticket} onClosed={() => setTicket(null)} onCloseTopic={() => closeTopic(ticket.id)} closing={close.isPending} /> : <>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
        {query.isPending && <p className="support-chat-muted p-4 text-center text-sm">Görüşmeler yükleniyor...</p>}{query.isError && <p role="alert" className="p-4 text-sm text-destructive">Görüşmeler alınamadı. <button onClick={() => query.refetch()}>Tekrar dene</button></p>}
        {query.data?.pages[0]?.items.length === 0 && <p className="support-chat-muted p-4 text-center text-sm">{search ? 'Bu ID için açık destek talebi bulunamadı.' : 'Henüz destek talebi yok.'}</p>}
        {query.data?.pages.flatMap(page => page.items).map(item => <SupportTicketCard key={item.id} ticket={item} onSelect={() => setTicket(item)} />)}
        {query.hasNextPage && <button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className="w-full p-3 text-sm">Daha fazla yükle</button>}
      </div>
      <form className="support-chat-search" onSubmit={e => { e.preventDefault(); setSearch(input.trim()); }}><input ref={searchInput} aria-label="Üye kimlik numarası" inputMode="numeric" maxLength={64} value={input} onChange={e => setInput(e.target.value)} placeholder="Üye ID ile ara..." />{search && <button type="button" onClick={() => { setInput(''); setSearch(''); }} className="text-xs">Temizle</button>}<button type="submit" aria-label="ID ile ara"><Search className="h-5 w-5" /></button></form>
    </>}
  </main>;
}