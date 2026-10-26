import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Ban, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useAgOfficial from '@/hooks/useAgOfficial';
import VoiceGiftButton from '@/components/profile/VoiceGiftButton';
export default function ProfileModeration({ userId, profile, onChanged, giftAction = null }) {
  const { user } = useCurrentUser();
  const own = useAgOfficial(user?.id), target = useAgOfficial(userId);
  const client = useQueryClient();
  const [pending, setPending] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const admin = user?.role === 'admin';
  const canAct = !own.loading && !target.loading && !user?.is_banned && (admin || own.active) && user?.id !== userId && profile && profile.role !== 'admin' && (admin || !target.active);
  const run = async () => {
    setBusy(true); setError('');
    try {
      await base44.functions.invoke('role-management', { action: pending, user_id: userId, active: !target.active, reason: 'Topluluk kurallarına aykırı davranış' });
      await client.invalidateQueries({ queryKey: ['ag-official'] });
      setPending(''); onChanged?.(pending === 'delete_user' ? { account_status: 'deleted' } : pending === 'ban_user' ? { ...profile, account_status: 'banned' } : profile);
    } catch (e) { setError(e.response?.data?.error || 'İşlem tamamlanamadı'); }
    finally { setBusy(false); }
  };
  const button = 'flex items-center justify-center gap-1 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-foreground disabled:opacity-50';
  return <section className="w-full space-y-2" onClick={e => e.stopPropagation()}>
    {canAct && <div className="grid grid-cols-2 gap-2">
      <button className={button} disabled={busy || profile.account_status === 'banned'} onClick={() => { setPending('ban_user'); setError(''); }}><Ban className="h-4 w-4 text-destructive" />BANLA</button>
      <button className={button} disabled={busy} onClick={() => { setPending('delete_user'); setError(''); }}><Trash2 className="h-4 w-4 text-destructive" />SİL</button>
      {admin && (giftAction
        ? <>
          <button className={`${button} min-w-0 px-1 text-[11px] leading-tight`} disabled={busy} onClick={() => { setPending('set_ag_official'); setError(''); }}><ShieldCheck className="h-4 w-4 shrink-0 text-premium-gold" />{target.active ? 'AG Yetkilisini Kaldır' : 'AG Yetkilisi'}</button>
          <VoiceGiftButton onClick={giftAction} compact />
        </>
        : <button className={`${button} col-span-2`} disabled={busy} onClick={() => { setPending('set_ag_official'); setError(''); }}><ShieldCheck className="h-4 w-4 text-premium-gold" />{target.active ? 'AG Yetkilisini Kaldır' : 'AG Yetkilisi'}</button>)}
    </div>}
    {admin && giftAction && !canAct && <VoiceGiftButton onClick={giftAction} compact />}
    {canAct && pending && <div className="rounded-xl border border-border bg-card p-3 text-center text-xs text-card-foreground">
      <p>{pending === 'delete_user' ? 'Bu hesap kalıcı silinecek. Onaylıyor musunuz?' : pending === 'ban_user' ? 'Hesap hemen banlanacak. Onaylıyor musunuz?' : target.active ? 'AG Yetkilisi yetkisi kaldırılsın mı?' : 'Banlama, kalıcı hesap silme ve destek yetkisi verilsin mi?'}</p>
      <div className="mt-2 flex justify-center gap-2"><button className={button} disabled={busy} onClick={run}>{busy ? 'İşleniyor...' : 'Onayla'}</button><button className={button} disabled={busy} onClick={() => setPending('')}>İptal</button></div>
    </div>}
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
  </section>;
}