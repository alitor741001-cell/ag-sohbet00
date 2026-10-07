import { useEffect, useRef, useState } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import UserBadge from '@/components/admin/UserBadge';
import UserGenderDialog from '@/components/admin/UserGenderDialog';
import FullUserProfile from '@/components/profile/FullUserProfile';
import { visibleEmail } from '@/lib/visibleEmail';


const btn = 'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap';

/** Cinsiyet düğmesi: kayıtlı cinsiyeti gösterir, eksikse düzeltmeye çağırır. */
const genderButtonLabel = (u) => (u?.gender === 'kadın' ? 'CİNSİYET: KADIN' : u?.gender === 'erkek' ? 'CİNSİYET: ERKEK' : 'CİNSİYET EKLE');

export default function AdminUsers({ pendingOnly = false }) {
  const { user: admin } = useCurrentUser();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [genderTarget, setGenderTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [idQuery, setIdQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [paidUserIds, setPaidUserIds] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const paymentsRef = useRef(new Map());
  const presenceRef = useRef(new Map());



  const filtered = users.filter((u) => {
    if (idQuery.trim() && u.member_id !== idQuery.trim()) return false;
    if (nameQuery.trim()) {
      const q = nameQuery.trim().toLowerCase();
      if (!(u.username || '').toLowerCase().includes(q) && !(u.full_name || '').toLowerCase().includes(q) && !(u.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const load = () => {
    base44.entities.User.list('-created_date', 500).then((u) => {
      setUsers(pendingOnly ? u.filter((x) => x.membership_status === 'pending') : u);
      setLoading(false);
    }).catch((e) => { setLoading(false); toast({ title: 'Liste yüklenemedi', description: e.message, variant: 'destructive' }); });
    // Tamamlanmış ödemeleri yükle — "Onayla" butonunu gizlemek için
    base44.entities.Payment.filter({ status: 'completed' }, '-created_date', 500).then((pays) => {
      paymentsRef.current = new Map(pays.map((p) => [p.id, p]));
      setPaidUserIds(new Set(pays.map((p) => p.user_id)));
    }).catch(() => {});
    base44.entities.UserPresence.filter({ online: true }, '-created_date', 500).then((presences) => {
      presenceRef.current = new Map(presences.map((p) => [p.id, p]));
      setOnlineUsers(new Set(presences.map((p) => p.user_id)));
    }).catch(() => {});
  };
  useEffect(() => {
    setLoading(true); load();
    const offUsers = subscribeEntity('User', (event) => {
      const id = event.data?.id || event.id;
      setUsers((current) => {
        const known = current.find((item) => item.id === id);
        if (event.type === 'delete') return known ? current.filter((item) => item.id !== id) : current;
        if (!known && event.type !== 'create') return current;
        const merged = { ...known, ...event.data, id };
        if (pendingOnly && merged.membership_status !== 'pending') return current.filter((item) => item.id !== id);
        return known ? current.map((item) => item.id === id ? merged : item) : [merged, ...current];
      });
    });
    const patchMarker = (records, event, publish, predicate) => {
      const id = event.data?.id || event.id;
      if (event.type === 'delete') records.delete(id);
      else records.set(id, { ...records.get(id), ...event.data, id });
      const next = new Set([...records.values()].filter(predicate).map((item) => item.user_id));
      publish((current) => current.size === next.size && [...next].every((id) => current.has(id)) ? current : next);
    };
    const offPayments = subscribeEntity('Payment', (event) => patchMarker(paymentsRef.current, event, setPaidUserIds, (item) => item.status === 'completed'));
    const offPresence = subscribeEntity('UserPresence', (event) => patchMarker(presenceRef.current, event, setOnlineUsers, (item) => item.online === true));
    return () => { offUsers(); offPayments(); offPresence(); };
  }, [pendingOnly]);

  const log = async (action, target) => { await base44.entities.AdminLog.create({ admin_id: admin?.id, admin_name: admin?.username || admin?.full_name, action, target }).catch(() => {}); };
  const notify = async (uid, title, body) => { await base44.entities.Notification.create({ user_id: uid, title, body, type: 'info' }).catch(() => {}); };

  const approve = async (u) => {
    try {
      await base44.entities.User.update(u.id, { membership_status: 'active', membership_start: new Date().toISOString(), membership_end: '' });
      await notify(u.id, 'Üyeliğiniz onaylandı', 'Premium içeriklere erişebilirsiniz.');
      await log('Üyelik onaylandı', u.email);
      base44.functions.invoke('admin-notify', {
        event: 'subscription_active',
        ref_id: `sub_active_manual:${u.id}`,
        title: 'Abonelik aktif edildi (Manuel)',
        body: u.username || u.full_name || u.email,
        link: '/admin/abonelikler',
        telegram_data: { username: u.username || u.full_name || u.email, package: 'Manuel Aktivasyon', date: new Date().toLocaleString('tr-TR') }
      }).catch(() => {});
      await base44.functions.invoke('send-approval-email', { user_id: u.id });
      toast({ title: 'Kullanıcı onaylandı ve e-posta gönderildi.' }); load();
    } catch (e) { toast({ title: 'Onaylanamadı', description: e.message, variant: 'destructive' }); }
  };
  const reject = async (u) => {
    try {
      await base44.entities.User.update(u.id, { membership_status: 'rejected' });
      await notify(u.id, 'Üyelik talebi reddedildi', 'Lütfen destek ile iletişime geçin.');
      await log('Üyelik reddedildi', u.email);
      toast({ title: 'Kullanıcı reddedildi.' }); load();
    } catch (e) { toast({ title: 'Reddedilemedi', description: e.message, variant: 'destructive' }); }
  };
  // Banla / Banı kaldır: engellenen hesap giriş yapamaz, odalardan düşer.
  const toggleBan = async (u) => {
    try {
      const banning = !u.is_banned;
      await base44.functions.invoke('role-management', banning
        ? { action: 'ban_user', user_id: u.id, reason: 'Yönetici tarafından engellendi' }
        : { action: 'unban_user', user_id: u.id });
      await log(banning ? 'Kullanıcı engellendi' : 'Kullanıcı engeli kaldırıldı', u.email);
      toast({ title: banning ? 'Kullanıcı engellendi' : 'Kullanıcı engeli kaldırıldı' });
      load();
    } catch (e) { toast({ title: 'İşlem başarısız', description: e.message, variant: 'destructive' }); }
  };
  const resetPass = async (u) => {
    try {
      await base44.auth.resetPasswordRequest(u.email);
      await log('Şifre sıfırlama isteği', u.email);
      toast({ title: 'Şifre sıfırlama bağlantısı gönderildi' });
    } catch (e) { toast({ title: 'Sıfırlama başarısız', description: e.message, variant: 'destructive' }); }
  };
  const del = async (u) => {
    try {
      await base44.functions.invoke('role-management', { action: 'delete_user', user_id: u.id });
      toast({ title: 'Kullanıcı silindi.' }); setConfirm(null); load();
    } catch (e) { toast({ title: 'Silinemedi', description: e.message, variant: 'destructive' }); }
  };

  if (loading) return <p className="text-muted-foreground">Yükleniyor...</p>;

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-4">{pendingOnly ? 'Kayıt Kontrol' : 'Kullanıcı Yönetimi'}</h1>
      {!pendingOnly && (
        <div className="flex flex-wrap gap-2 mb-4">
          <input value={idQuery} onChange={(e) => setIdQuery(e.target.value)} placeholder="Üye No ile ara (8 haneli)" className="bg-card border border-border rounded-lg px-3 py-2 text-sm w-44 outline-none focus:ring-2 focus:ring-ring" />
          <input value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="İsim / kullanıcı adı / e-posta ile ara" className="bg-card border border-border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] outline-none focus:ring-2 focus:ring-ring" />
        </div>
      )}
      {users.length === 0 ? <p className="text-muted-foreground text-sm">{pendingOnly ? 'Onay bekleyen kayıt yok.' : 'Kullanıcı yok.'}</p> :
        filtered.length === 0 ? <p className="text-muted-foreground text-sm">Eşleşen kullanıcı bulunamadı.</p> :
        <div className="space-y-2">
          {filtered.map((u) => {
            const isActive = u.membership_status === 'active';
            return (
              <div key={u.id} className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button type="button" onClick={() => setDetail(u)} className="shrink-0 active:opacity-70" aria-label="Profil kartını aç">
                    <UserBadge userId={u.id} name={u.username || u.full_name || '?'} avatar={u.avatar} memberId={u.member_id} size="md" displayRole={u.display_role} customRole={u.custom_role} profileFrame={u.profile_frame} frameScale={u.profile_frame_scale} />
                  </button>
                  <div className="hidden sm:block min-w-0">
                    {visibleEmail(u) && <p className="text-xs text-muted-foreground truncate">{visibleEmail(u)}</p>}
                  </div>
                </div>
                {!u.is_banned && <span className={`text-xs px-2 py-1 rounded ${isActive ? 'bg-green-500/20 text-green-400' : u.membership_status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>{isActive ? 'Aktif' : u.membership_status === 'pending' ? 'Beklemede' : 'Pasif'}</span>}
                {paidUserIds.has(u.id) && <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 font-semibold">ÖDENDİ</span>}
                {onlineUsers.has(u.id) ? <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">Online</span> : <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">Offline</span>}
                {u.is_banned && <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 font-semibold" title={u.ban_reason}>🚫 ENGELLİ</span>}
                <div className="flex flex-wrap gap-1.5">
                {!pendingOnly && <button onClick={() => setDetail(u)} className={`${btn} bg-secondary hover:bg-secondary/70`}>GÖRÜNTÜLE</button>}
                {pendingOnly && !isActive && paidUserIds.has(u.id) && <button onClick={() => approve(u)} className={`${btn} bg-green-500/20 text-green-400 hover:bg-green-500/30`}>AKTİF ET</button>}
                {pendingOnly && !isActive && !paidUserIds.has(u.id) && <button onClick={() => approve(u)} className={`${btn} bg-green-500/20 text-green-400 hover:bg-green-500/30`}>ONAYLA</button>}
                  {!pendingOnly && <button onClick={() => toggleBan(u)} className={`${btn} ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>{u.is_banned ? 'BANI KALDIR' : 'BANLA'}</button>}
                  {pendingOnly && <button onClick={() => reject(u)} className={`${btn} bg-red-500/20 text-red-400 hover:bg-red-500/30`}>REDDET</button>}
                  {!pendingOnly && <button onClick={() => resetPass(u)} className={`${btn} bg-purple-500/20 text-purple-400 hover:bg-purple-500/30`}>ŞİFRE SIFIRLA</button>}
                  {!pendingOnly && <button onClick={() => setGenderTarget(u)} className={`${btn} bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30`}>{genderButtonLabel(u)}</button>}
                  <button onClick={() => setConfirm(u)} className={`${btn} bg-red-500/20 text-red-400 hover:bg-red-500/30`}>SİL</button>
                </div>
              </div>
            );
          })}
        </div>}

      {detail && (
        <FullUserProfile
          userId={detail.id}
          name={detail.username || detail.full_name}
          avatar={detail.avatar}
          frame={detail.profile_frame}
          frameScale={detail.profile_frame_scale}
          onClose={() => setDetail(null)}
          info={[
            { label: 'E-posta', value: visibleEmail(detail) || '-' },
            { label: 'Üyelik durumu', value: detail.is_banned ? 'Engelli' : detail.membership_status === 'active' ? 'Aktif' : detail.membership_status === 'pending' ? 'Beklemede' : 'Pasif' },
            ...(detail.is_banned && detail.ban_reason ? [{ label: 'Engel nedeni', value: detail.ban_reason }] : []),
            ...(detail.is_banned && detail.ban_description ? [{ label: 'Engel açıklaması', value: detail.ban_description }] : []),
          ]}
        />
      )}
      <UserGenderDialog
        user={genderTarget}
        onClose={() => setGenderTarget(null)}
        onSaved={async (target, gender) => {
          await notify(target.id, 'Cinsiyet bilgisi güncellendi', gender === 'erkek' ? 'Profil kartınız mavi-kırmızı temada görünecek.' : 'Profil kartınız pembe temada görünecek.');
          await log(`Cinsiyet değiştirildi (${gender})`, target.email);
          setGenderTarget(null);
          toast({ title: 'Cinsiyet güncellendi' });
          load();
        }}
      />
      <ConfirmDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Kullanıcıyı sil?" description={`${visibleEmail(confirm) || confirm?.username || confirm?.full_name || 'Kullanıcı'} kalıcı olarak silinecek.`} onConfirm={() => del(confirm)} />
    </div>
  );
}