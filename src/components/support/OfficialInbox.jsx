import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import OfficialBadge from '@/components/profile/OfficialBadge';
import OfficialThread from '@/components/support/OfficialThread';
export default function OfficialInbox() {
  const [ticket, setTicket] = useState(null);
  const query = useInfiniteQuery({ queryKey: ['official-tickets'], initialPageParam: undefined,
    queryFn: async ({ pageParam }) => (await base44.functions.invoke('officialSupport', { action: 'list', cursor: pageParam })).data,
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined, refetchInterval: 3000 });
  return <main className="fixed inset-0 z-[65] flex flex-col overflow-hidden bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] text-foreground">
    <header className="mb-3 flex flex-wrap items-center justify-between gap-2"><Link to="/" className="text-sm font-bold text-primary">Ana Sayfa</Link><h1 className="font-bold">Canlı Destek</h1><OfficialBadge /></header>
    {ticket ? <><button onClick={() => setTicket(null)} className="mb-2 text-left text-sm text-primary">Görüşmelere dön</button><OfficialThread key={ticket.id} ticket={ticket} onClosed={() => setTicket(null)} /></> : <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
      {query.isPending && <p>Görüşmeler yükleniyor...</p>}{query.isError && <p role="alert" className="text-destructive">Görüşmeler alınamadı. <button onClick={() => query.refetch()}>Tekrar dene</button></p>}
      {query.data?.pages[0]?.items.length === 0 && <p className="text-sm text-muted-foreground">Henüz destek talebi yok.</p>}
      {query.data?.pages.flatMap(page => page.items).map(item => <button key={item.id} onClick={() => setTicket(item)} className="block w-full rounded-xl border border-border bg-card p-3 text-left"><p className="font-bold">{item.user_name || 'Kullanıcı'}</p><p className="text-sm text-muted-foreground">{item.subject}</p><span className="text-xs text-primary">{item.status === 'answered' ? 'Cevaplandı' : 'Yanıt bekliyor'}</span></button>)}
      {query.hasNextPage && <button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className="rounded-lg bg-secondary p-3 text-sm">Daha fazla yükle</button>}
    </div>}
  </main>;
}