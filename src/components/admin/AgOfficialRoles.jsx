import { useEffect, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import UserBadge from '@/components/admin/UserBadge';
import FullUserProfile from '@/components/profile/FullUserProfile';
import OfficialBadge from '@/components/profile/OfficialBadge';
export default function AgOfficialRoles() {
  const client = useQueryClient();
  const [detail, setDetail] = useState(null), [confirm, setConfirm] = useState(null);
  const query = useInfiniteQuery({ queryKey: ['admin-officials'], initialPageParam: undefined,
    queryFn: async ({ pageParam }) => (await base44.functions.invoke('adminOfficials', { cursor: pageParam })).data,
    getNextPageParam: page => page.has_more ? page.next_cursor : undefined });
  useEffect(() => subscribeEntity('AgOfficial', () => client.invalidateQueries({ queryKey: ['admin-officials'] })), [client]);
  const revoke = useMutation({ mutationFn: id => base44.functions.invoke('role-management', { action: 'set_ag_official', user_id: id, active: false }),
    onSuccess: async () => { setConfirm(null); await Promise.all([client.invalidateQueries({ queryKey: ['admin-officials'] }), client.invalidateQueries({ queryKey: ['ag-official'] })]); } });
  return <section className="mb-5 space-y-3 rounded-xl border border-border bg-card p-3">
    <h2 className="text-lg font-bold">AG Yetkilisi Rolleri</h2>
    {query.isPending && <p className="text-sm text-muted-foreground">Yükleniyor...</p>}
    {query.isError && <p role="alert" className="text-sm text-destructive">Roller alınamadı. <button onClick={() => query.refetch()}>Tekrar dene</button></p>}
    {query.data?.pages[0]?.items.length === 0 && <p className="text-sm text-muted-foreground">Henüz AG Yetkilisi atanmadı. Kullanıcının profil kartından yetki verebilirsiniz.</p>}
    {query.data?.pages.flatMap(page => page.items).map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
      {row.profile ? <UserBadge userId={row.user_id} name={row.profile.username || row.profile.full_name || 'Kullanıcı'} avatar={row.profile.avatar} memberId={row.profile.member_id} profileFrame={row.profile.profile_frame} frameScale={row.profile.profile_frame_scale} size="md" onOpen={() => setDetail(row.profile)} /> : <span className="text-muted-foreground">Silinmiş hesap</span>}
      <OfficialBadge /><button className="min-h-11 rounded-lg bg-secondary px-3 text-xs font-bold text-destructive" disabled={revoke.isPending || !row.profile} onClick={() => { revoke.reset(); setConfirm(row.user_id); }}>Yetkiyi geri al</button>
      {confirm === row.user_id && <div className="w-full text-sm">Oda koruması ve tüm AG yetkileri kaldırılsın mı?<div className="mt-2 flex gap-3"><button disabled={revoke.isPending} onClick={() => revoke.mutate(row.user_id)} className="min-h-11 text-destructive">{revoke.isPending ? 'Kaldırılıyor...' : 'Evet, kaldır'}</button><button disabled={revoke.isPending} onClick={() => setConfirm(null)}>İptal</button></div></div>}
    </div>)}
    {revoke.isError && <p role="alert" className="text-sm text-destructive">{revoke.error.response?.data?.error || 'Yetki kaldırılamadı.'}</p>}
    {query.hasNextPage && <button disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()} className="min-h-11 rounded-lg bg-secondary px-3 text-sm">Daha fazla yükle</button>}
    {detail && <FullUserProfile userId={detail.id} name={detail.username || detail.full_name} avatar={detail.avatar} onClose={() => setDetail(null)} info={[{ label: 'Görev', value: 'AG Yetkilisi' }, { label: 'Üye No', value: detail.member_id || '-' }]} />}
  </section>;
}