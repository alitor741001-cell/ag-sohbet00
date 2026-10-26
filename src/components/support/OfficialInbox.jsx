import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useBackDismiss from '@/hooks/useBackDismiss';
import OfficialBadge from '@/components/profile/OfficialBadge';
import OfficialThread from '@/components/support/OfficialThread';
import SupportMemberIdentity from '@/components/support/SupportMemberIdentity';
const call = async payload => (await base44.functions.invoke('officialSupport', payload)).data;
export default function OfficialInbox() {
  const [ticket, setTicket] = useState(null);
  const [input, setInput] = useState(''), [search, setSearch] = useState('');
  const navigate = useNavigate(), client = useQueryClient();
  useBackDismiss(!!ticket, () => setTicket(null));
  const query = useInfiniteQuery({ queryKey: ['official-tickets', search], initialPageParam: undefined,
    queryFn: ({ pageParam }) => call({ action: 'list', cursor: pageParam, member_id: search }),
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, refetchInterval: 3000 });
  const close = useMutation({ mutationFn: id => call({ action: 'close', ticket_id: id }), onSuccess: () => {
    setTicket(null); client.invalidateQueries({ queryKey: ['official-tickets'] });
  } });
  const closeTopic = async id => {
    if (!window.confirm('Konu kapatılsın mı? Mesajlar üyeden bir dakika sonra silinecek.')) return false;
    try { await close.mutateAsync(id); return true; }
    catch { return false; }
  };
  return <main className="fixed inset-0 z-[65] flex flex-col overflow-hidden bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-foreground">
    <header className="mb-3 flex flex-wrap items-center justify-between gap-2"><button type="button" onClick={() => ticket ? setTicket(null) : window.history.length > 1 ? navigate(-1) : navigate('/')} className="flex items-center gap-1 text-sm font-bold text-primary"><ArrowLeft className="h-5 w-5" />Geri</button><h1 className="font-bold">Canlı Destek</h1><OfficialBadge /></header>
    {close.isError && <p role="alert" className="mb-2 text-sm text-destructive">{close.error.response?.data?.error || 'Konu kapatılamadı.'}</p>}
    {ticket ? <OfficialThread key={ticket.id} ticket={ticket} onClosed={() => setTicket(null)} onCloseTopic={() => closeTopic(ticket.id)} closing={close.isPending} /> : <>
      <form className="mb-3 flex gap-2" onSubmit={e => { e.preventDefault(); setSearch(input.trim()); }}><input aria-label="Üye kimlik numarası" inputMode="numeric" maxLength={64} value={input} onChange={e => setInput(e.target.value)} placeholder="Üye ID numarası" className="min-w-0 flex-1 rounded-lg border border-border bg-secondary p-2 text-base" /><button className="rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground">ID ile ara</button>{search && <button type="button" onClick={() => { setInput(''); setSearch(''); }} className="text-xs text-primary">Temizle</button>}</form>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {query.isPending && <p>Görüşmeler yükleniyor...</p>}{query.isError && <p role="alert" className="text-destructive">Görüşmeler alınamadı. <button onClick={() => query.refetch()}>Tekrar dene</button></p>}
        {query.data?.pages[0]?.items.length === 0 && <p className="text-sm text-muted-foreground">{search ? 'Bu ID için açık destek talebi bulunamadı.' : 'Henüz destek talebi yok.'}</p>}
        {query.data?.pages.flatMap(page => page.items).map(item => <div key={item.id} className="space-y-2 rounded-xl border border-border bg-card p-3"><SupportMemberIdentity ticket={item} onCloseTopic={() => closeTopic(item.id)} /><button type="button" onClick={() => setTicket(item)} className="block w-full text-left"><p className="text-sm text-muted-foreground">{item.subject}</p><span className="text-xs text-primary">{item.status === 'answered' ? 'Cevaplandı' : 'Yanıt bekliyor'} · Görüşmeyi aç</span></button></div>)}
        {query.hasNextPage && <button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className="rounded-lg bg-secondary p-3 text-sm">Daha fazla yükle</button>}
      </div>
    </>}
  </main>;
}