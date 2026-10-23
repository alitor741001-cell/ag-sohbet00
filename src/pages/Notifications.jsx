import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import EmptyState from '@/components/movie/EmptyState';
import AgencyInviteActions from '@/components/notifications/AgencyInviteActions';
import InviteDetailSheet from '@/components/agency/InviteDetailSheet';
import { parseInviteRef } from '@/lib/agency';
import PullToRefresh from '@/components/home/PullToRefresh';
import { markSeen } from '@/lib/seenBadge';

/** Bildirimin geldiği tarih ve saat: 06.10.2026 02:20 */
const formatWhen = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/** Bildirimler: sohbet ekranı gibi tam ekran açılır; tüm sistem bildirimleri burada listelenir. */
export default function Notifications() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = () => location.state?.returnTo && window.history.state?.idx > 0
    ? navigate(-1)
    : navigate('/arkadaslar?view=chats', { replace: true });
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [inviteIds, setInviteIds] = useState([]);
  const [detailInviteId, setDetailInviteId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    base44.entities.Notification.filter({ user_id: user.id }, '-created_date', 50).then((r) => { setItems(r); setLoading(false); }).catch(() => setLoading(false));
  };
  const loadInvites = () => {
    if (!user) return;
    base44.entities.AgencyInvite.filter({ invitee_id: user.id, status: 'pending' }, '-created_date', 20)
      .then((rows) => setInviteIds(rows.map((row) => row.id))).catch(() => setInviteIds([]));
  };
  useEffect(() => { markSeen('notes', user?.id); }, [user?.id, items.length]);
  useEffect(() => {
    load();
    loadInvites();
    const unsub = subscribeEntity('Notification', () => load());
    // Yoklama yedeği — realtime kaçırsa diye 5 saniyede bir; sekme arkadayken durur.
    const interval = setInterval(() => { if (document.visibilityState !== 'hidden') { load(); loadInvites(); } }, 5000);
    return () => { unsub(); clearInterval(interval); };
  }, [user?.id]);

  const markRead = async (n) => {
    await base44.entities.Notification.update(n.id, { read: true }).catch(() => {});
    load();
  };
  const markAll = async () => {
    await Promise.all(items.filter((n) => !n.read).map((n) => base44.entities.Notification.update(n.id, { read: true })));
    load();
  };
  const deleteAll = async () => {
    await base44.entities.Notification.deleteMany({ user_id: user.id });
    setItems([]); toast({ title: 'Tüm bildirimler silindi' });
  };

  return (
    <div className="dark mx-auto min-h-[calc(100vh-8rem)] supports-[height:100dvh]:min-h-[calc(100dvh-8rem)] w-full min-w-0 max-w-5xl bg-background text-white">
      {/* Aşağı çekerek tazeleme: bildirimler ve bekleyen davetler yeniden okunur. */}
      <PullToRefresh onRefresh={() => { load(); loadInvites(); }}>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/10 bg-background px-3 py-2.5">
        <button onClick={goBack} aria-label="Geri" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 active:scale-95">
          <ArrowLeft className="h-4 w-4 text-white" />
        </button>
        <h1 className="flex-1 text-base font-extrabold">Bildirimler</h1>
        {items.some((n) => !n.read) && (
          <button onClick={markAll} className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white"><Check className="w-3.5 h-3.5" /> Okundu</button>
        )}
        {items.length > 0 && (
          <button onClick={deleteAll} className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-400"><Trash2 className="w-3.5 h-3.5" /> Sil</button>
        )}
      </header>

      <div className="p-3">
        {loading ? <p className="py-10 text-center text-sm text-gray-400">Yükleniyor...</p> :
         items.length === 0 ? <EmptyState icon={Bell} title="Bildirim yok" description="Henüz bildiriminiz bulunmuyor." /> :
         <div className="space-y-2">
           {items.map((n) => {
             const inviteId = parseInviteRef(n.ref_id);
             const showInvite = n.type === 'agency_invite' && !!inviteId && inviteIds.includes(inviteId);
             // Asistanlık daveti: yeşil kart detay penceresini açar, onay orada verilir.
             const assistantInviteId = n.type === 'assistant_invite' ? parseInviteRef(n.ref_id) : '';
             const showAssistantInvite = !!assistantInviteId && inviteIds.includes(assistantInviteId);
             return (
             <div key={n.id} className={`p-3 rounded-xl border flex gap-3 ${n.read ? 'bg-card border-border' : 'bg-primary/10 border-primary/30'}`}>
               <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
               <div className="flex-1 min-w-0">
                 <p className="font-semibold text-sm">{n.title}</p>
                 {n.body && <p className="text-sm text-gray-400">{n.body}</p>}
                 {showInvite ? (
                   <AgencyInviteActions inviteId={inviteId} onAnswered={() => { markRead(n); loadInvites(); }} />
                 ) : showAssistantInvite ? (
                   <button
                     onClick={() => { markRead(n); setDetailInviteId(assistantInviteId); }}
                     className="mt-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-center text-xs font-bold text-white active:scale-[0.99]"
                   >
                     Detaylı görüntülemek için tıklayın
                   </button>
                 ) : n.link && <Link to={n.link} className="text-xs text-primary">Görüntüle →</Link>}
               </div>
               <div className="flex shrink-0 flex-col items-end gap-1">
                 <span className="whitespace-nowrap text-[10px] font-medium tabular-nums text-gray-500">{formatWhen(n.created_date)}</span>
                 {!n.read && <button onClick={() => markRead(n)} className="text-xs text-gray-400 active:text-white">Okundu</button>}
               </div>
             </div>
             );
           })}
         </div>}
      </div>
      </PullToRefresh>

      {/* Asistanlık daveti detayı: ajans ve davet edilen bilgileri, 10 saniyelik onay sayacı. */}
      <InviteDetailSheet
        open={!!detailInviteId}
        inviteId={detailInviteId}
        onClose={() => setDetailInviteId('')}
        onAnswered={() => { load(); loadInvites(); }}
      />
    </div>
  );
}