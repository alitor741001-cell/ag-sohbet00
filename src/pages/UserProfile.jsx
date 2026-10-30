import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Image } from '@/components/ui/image';
import { ArrowLeft, Crown, Hash, MessageCircle, UserPlus, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import RoleBadge from '@/components/RoleBadge';
import ProfileAgencyBadges from '@/components/profile/ProfileAgencyBadges';
import ProfileModeration from '@/components/profile/ProfileModeration';
import ProfileFrame from '@/components/ProfileFrame';
import { getRoleInfo } from '@/lib/roles';
import ProfileRoomActions from '@/components/profile/ProfileRoomActions';
import FollowButton from '@/components/profile/social/FollowButton';
import useXp from '@/hooks/useXp';
import XpAvatar from '@/components/xp/XpAvatar';
import XpStatsCard from '@/components/xp/XpStatsCard';
import { AccountStatusMark, ACCOUNT_MARKS, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { daysInApp } from '@/lib/xp';
import usePageScrollLock from '@/hooks/usePageScrollLock';

export default function UserProfile({ userId, roomIdOverride, onBack, onMessage, embedded = false }) {
  usePageScrollLock();
  const { id: routeUserId } = useParams();
  const id = userId || routeUserId;
  const roomId = roomIdOverride || new URLSearchParams(window.location.search).get('room');
  const navigate = useNavigate();
  const { user: me } = useCurrentUser();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [relation, setRelation] = useState(null);
  const [requesting, setRequesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const xpStats = useXp([id])[id];

  useEffect(() => {
    let active = true;
    setProfile(null); setErr(''); setLoading(true);
    const load = () => base44.functions.invoke('user-profile', { user_id: id })
      .then((res) => { if (active) { setProfile(res.data); setErr(''); } })
      .catch((e) => { if (active) { if (e?.response?.status === 404) setProfile({ account_status: 'deleted' }); else setErr(e.response?.data?.error || e.message); } })
      .finally(() => { if (active) setLoading(false); });
    load();
    const off = subscribeEntity('User', (event) => { if ((event.data?.id || event.id) === id) load(); });
    // Profil 5 saniyede bir sessizce tazelenir: seviye, VIP ve rozetler güncel kalır.
    const poll = window.setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 5000);
    return () => { active = false; off(); window.clearInterval(poll); };
  }, [id]);

  useEffect(() => {
    if (!me?.id || me.id === id) return;
    let active = true;
    setRelation(null);
    const load = () => base44.entities.Friendship.filter({ members: me.id }, '-updated_date', 200)
      .then((items) => { if (active) setRelation(items.find((item) => item.members?.includes(id)) || null); });
    load();
    const off = subscribeEntity('Friendship', () => load());
    // Arkadaşlık durumu 5 saniyede bir sessizce tazelenir.
    const poll = window.setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 5000);
    return () => { active = false; off(); window.clearInterval(poll); };
  }, [id, me?.id]);

  // Profil açıldığında ziyaret kaydı düşülür: sahibi kimlerin baktığını görebilir.
  useEffect(() => {
    if (!me?.id || me.id === id) return;
    base44.functions.invoke('social-service', { action: 'visit', profile_id: id }).catch(() => {});
  }, [id, me?.id]);

  const addFriend = async () => {
    setRequesting(true);
    try {
      const response = await base44.functions.invoke('friend-service', { action: 'request', user_id: id });
      setRelation(response.data.friendship);
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (error) {
      toast({ title: 'İstek gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally { setRequesting(false); }
  };

  const startChat = async () => {
    if (onMessage) { onMessage(id); return; }
    try {
      const res = await base44.functions.invoke('dm-service', { action: 'start', target_id: id });
      if (res?.data?.conversation) {
        navigate(`/arkadaslar?view=chats&chat=${res.data.conversation.id}`);
      }
    } catch (error) {
      toast({ title: 'Sohbet açılamadı', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="dark fixed inset-0 z-[1000] flex items-center justify-center bg-background text-foreground"><button onClick={() => onBack ? onBack() : window.history.length > 1 ? navigate(-1) : navigate('/')} className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex items-center gap-1 text-sm font-bold"><ArrowLeft className="h-4 w-4" />Geri</button><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  const isSelf = me?.id === id;
  const accountState = getAccountState(profile);

  // Engellenen hesapta bilgiler görünür kalır; yalnızca profil resmi ban görseline döner.
  if (accountState && !isSelf && accountState.status !== 'banned') return (
    <div className="dark fixed inset-0 z-[1000] flex min-h-screen items-center justify-center overflow-y-auto bg-background p-4 pt-[env(safe-area-inset-top)] text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
        <AccountStatusMark status={accountState.status} />
        <h1 className="mt-4 text-xl font-bold">{accountState.name}</h1>
        <p className="mt-2 text-sm text-destructive">{accountState.message}</p>
        <button onClick={() => onBack ? onBack() : window.history.length > 1 ? navigate(-1) : navigate('/')} className="mt-5 rounded-lg bg-secondary px-5 py-2 text-sm font-semibold">Geri</button>
      </div>
    </div>
  );

  return (
    <div className="dark fixed inset-0 z-[1000] overflow-y-auto overscroll-contain bg-background pt-[env(safe-area-inset-top)] text-foreground">
    <div className="w-full min-w-0 px-4 sm:px-6 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] max-w-2xl md:max-w-3xl xl:max-w-4xl mx-auto">
      <button onClick={() => onBack ? onBack() : window.history.length > 1 ? navigate(-1) : navigate('/')} className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Geri</button>
      {err ? <p className="text-center text-destructive py-10">{err}</p> : profile && (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center">
          <div className={`relative mb-8 ${profile.vip_look?.avatar ? 'vip-avatar-active' : ''}`}>
            {accountState?.status === 'banned' ? (
              <Image src={ACCOUNT_STATES.banned.image} className="w-28 h-28 rounded-full border border-border object-cover" fittingType="fill" />
            ) : profile.profile_frame ? (
              <ProfileFrame frame={profile.profile_frame} size="lg" avatar={profile.avatar} name={profile.username || profile.full_name} frameScale={profile.profile_frame_scale} panX={profile.profile_avatar_x} panY={profile.profile_avatar_y}>
                {profile.avatar ? <Image src={profile.avatar} className="vip-avatar-picture w-28 h-28 rounded-full object-cover" fittingType="fill" /> :
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl font-bold">{(profile.username || profile.full_name || '?')[0]}</div>}
              </ProfileFrame>
            ) : (
              <XpAvatar avatar={profile.avatar} name={profile.username || profile.full_name} frame={xpStats?.frame} size="lg" />
            )}
          </div>
          {accountState?.status === 'banned' && <p className="mb-3 text-[11px] font-black tracking-[0.3em] text-destructive">{ACCOUNT_MARKS.banned}</p>}
          <h1 className="max-w-full text-2xl font-extrabold flex flex-wrap justify-center items-center gap-2 [overflow-wrap:anywhere]">{profile.title || profile.username || profile.full_name || 'Kullanıcı'} {(profile.role === 'admin' || profile.role === 'moderator') && <Crown className="w-5 h-5 text-amber-400" />}</h1>
          {getRoleInfo(profile).label && <div className="mt-1.5"><RoleBadge user={profile} size="md" /></div>}
          <div className="mt-3 w-full"><ProfileAgencyBadges profile={profile} userId={id} /></div>
          <div className="mt-3 w-full"><ProfileModeration userId={id} profile={profile} onChanged={setProfile} /></div>
          {['admin', 'moderator'].includes(profile.role) && <p className="mt-2 text-sm font-bold text-primary">{profile.role === 'admin' ? 'YÖNETİCİ' : 'MODERATÖR'}</p>}
          <div className="mt-4 w-full"><XpStatsCard stats={xpStats} days={daysInApp(profile.created_date)} compact /></div>
          {profile.title && <p className="text-base font-semibold text-gradient mt-1">{profile.title}</p>}
          {profile.username && profile.username !== profile.title && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          <div className="mt-4 inline-flex items-center gap-2 bg-secondary/60 rounded-full pl-4 pr-1.5 py-1.5">
            <Hash className="w-4 h-4 text-primary" />
            <span className="font-mono text-lg font-bold tracking-wider">{profile.member_id}</span>
            <button onClick={() => { navigator.clipboard?.writeText(profile.member_id || ''); toast({ title: 'Üye No kopyalandı' }); }} className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 active:scale-95 transition"><Copy className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Üye No</p>
          {profile.created_date && <p className="text-xs text-muted-foreground mt-3">Katılım: {new Date(profile.created_date).toLocaleDateString('tr-TR')}</p>}
          {!isSelf && !accountState && (!relation || ['removed', 'rejected'].includes(relation.status)) && <button onClick={addFriend} disabled={requesting} className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"><UserPlus className="w-4 h-4" />{requesting ? 'Gönderiliyor...' : 'Arkadaş Ekle'}</button>}
          {!isSelf && !accountState && relation?.status === 'pending' && <p className="mt-5 text-sm font-semibold text-amber-400">Arkadaşlık isteği bekliyor</p>}
          {!isSelf && !accountState && relation?.status === 'accepted' && <div className="mt-5 flex flex-col items-center gap-3"><p className="text-sm font-semibold text-green-400">Arkadaşsınız</p><button onClick={startChat} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold"><MessageCircle className="w-4 h-4" /> Mesaj Yaz</button></div>}
          {!isSelf && !accountState && relation?.status !== 'accepted' && <button onClick={startChat} className="mt-3 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Mesaj Yaz</button>}
          {!isSelf && !accountState && (
            <div className="mt-4 w-full max-w-xs">
              <FollowButton userId={id} />
            </div>
          )}
          {!accountState && <ProfileRoomActions userId={id} me={me} roomId={roomId} />}

        </div>
      )}
    </div>
    </div>
  );
}