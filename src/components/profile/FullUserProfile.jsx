import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, ChevronRight, Loader2, MessageSquare, Mic2, MicOff, Settings, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';
import { ROOM_BLUE, ageFromBirthDate, formatDate, genderPalette } from '@/components/profile/genderPalette';
import { agencyApi } from '@/lib/agency';
import ProfileHeroBlock from '@/components/profile/ProfileHeroBlock';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ProfileIdentityBlock from '@/components/profile/ProfileIdentityBlock';
import FollowButton from '@/components/profile/social/FollowButton';
import { AccountStatusMark, ACCOUNT_MARKS, ACCOUNT_STATES, getAccountState } from '@/components/friends/AccountStatusAvatar';
import { broadcasterState } from '@/lib/broadcaster';
import useBackDismiss from '@/hooks/useBackDismiss';

/**
 * Odalarda (film ve sesli oda) sohbet, izleyici listesi ya da koltukta bir profilin üstüne
 * dokununca açılan tam ekran profil kartı. Renkler kişinin cinsiyetine göre değişir:
 * kadın → pembe/altın, erkek → mavi/kırmızı.
 */
export default function FullUserProfile({
  open = true, userId, name, avatar, frame, frameScale,
  hidden = false, muted = false, level = 0, roomId, self = false, sheet = false,
  theme = '', hideSettings = false, hideBlock = false,
  onClose, onMessage, tiles = [], footer = [], info = [],
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState(null);
  const [relation, setRelation] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Profil kartı birleşik geri yığınında: geri tuşu önce kartı kapatır.
  useBackDismiss(open, onClose);

  const isSelf = self || userId === user?.id;

  useEffect(() => {
    if (!open || !userId || hidden) { setProfile(null); setRelation(''); return; }
    let alive = true;
    setProfile(null);
    setRelation('');
    // Profil, açıkken tazelenebilsin diye fonksiyona alındı: ban anında görsel değişir.
    const load = () => base44.functions.invoke('user-profile', { user_id: userId })
      .then((response) => { if (alive) setProfile(response?.data || {}); })
      .catch((error) => { if (alive) setProfile(error?.response?.status === 404 ? { account_status: 'deleted' } : {}); });
    load();
    // Kart açıkken ban / ban kaldırma anında işler: kayıt değişince profil yeniden okunur.
    const off = subscribeEntity('User', (event) => { if ((event.data?.id || event.id) === userId) load(); });
    if (user?.id && userId !== user.id) {
      base44.entities.Friendship.filter({ members: userId }, '-created_date', 50)
        .then((rows) => {
          const found = (rows || []).find((row) => row.members.includes(user.id));
          if (alive) setRelation(found?.status === 'accepted' ? 'friend' : found?.status === 'pending' ? 'pending' : '');
        })
        .catch(() => {});
    }
    return () => { alive = false; off(); };
  }, [open, userId, hidden, user?.id]);

  // Profil açıldığında ziyaret kaydı düşülür: sahibi kimlerin baktığını görebilir.
  useEffect(() => {
    if (!open || !userId || hidden) return;
    if (!user?.id || userId === user.id) return;
    base44.functions.invoke('social-service', { action: 'visit', profile_id: userId }).catch(() => {});
  }, [open, userId, hidden, user?.id]);

  if (!open || !userId) return null;

  // Film odası kartı mavi + kırmızı; kadın profilinde ve gizli kullanıcıda cinsiyet paleti korunur.
  const palette = theme === 'blue' && !hidden && profile?.gender !== 'kadın'
    ? ROOM_BLUE
    : genderPalette(profile?.gender, hidden);
  const loading = !hidden && !profile;
  // Engellenen hesapta bilgiler görünür kalır: yalnızca profil resmi ban görseline döner.
  // Silinen hesapta gösterilecek bilgi kalmadığı için kart durum ekranına geçer.
  const accountState = hidden ? null : getAccountState(profile);
  const banned = accountState?.status === 'banned';
  const shownName = hidden ? (name || 'Gizli Kullanıcı') : (profile?.username || profile?.full_name || name || 'Kullanıcı');
  const shownAvatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || avatar || '');
  const memberId = !hidden && profile?.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const age = hidden ? null : ageFromBirthDate(profile?.birth_date);
  const genderLabel = profile?.gender === 'erkek' ? 'Erkek' : profile?.gender === 'kadın' ? 'Kadın' : 'Belirtilmedi';
  // Ajans sahibi etiketi: kişinin kendi ajansı varsa kartta görünür (başka ajanda yayıncı olsa bile).
  const ownerAgency = !hidden && (profile?.owned_agency_name
    ? { name: profile.owned_agency_name, code: profile.owned_agency_code || '' }
    : (profile?.agency_role === 'owner' && profile?.agency_name ? { name: profile.agency_name, code: profile.agency_code || '' } : null));
  // Ülke etiketi: normal üyede Türkiye, yayıncı/ajans üyesinde Almanya.
  const badge = broadcasterState(profile);
  const showSocial = !isSelf && !hidden && !accountState;
  // Ajans sahibi, kendi ajansında olmayan bir kullanıcıyı yayıncı olarak davet edebilir.
  // Yayıncı daveti yalnızca arkadaş olduğun kullanıcılara gönderilebilir.
  const canInvite = showSocial && relation === 'friend'
    && (user?.agency_role === 'owner' || user?.agency_role === 'assistant') && !!user?.agency_record_id
    && !!profile && profile.agency_record_id !== user?.agency_record_id;

  const inviteBroadcaster = async () => {
    try {
      await agencyApi('invite', { user_id: userId });
      setInviteSent(true);
      toast({ title: '🎤 Davet gönderildi', description: `${shownName} kişisine yayıncı daveti iletildi.` });
    } catch (error) {
      toast({ title: 'Davet gönderilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(memberId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Kimlik kopyalandı', description: `#${memberId}` });
    } catch {
      toast({ title: 'Kopyalanamadı', variant: 'destructive' });
    }
  };

  const addFriend = async () => {
    try {
      await base44.functions.invoke('friend-service', { action: 'request', user_id: userId });
      setRelation('pending');
      toast({ title: 'Arkadaşlık isteği gönderildi' });
    } catch (error) {
      toast({ title: 'İşlem başarısız', description: error.response?.data?.error || error.message, variant: 'destructive' });
    }
  };

  const header = (
    <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold text-white"
            style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
          <div className="flex items-center gap-2">
            {muted && <MicOff className="h-4 w-4" style={{ color: palette.accent2 }} />}
            {isSelf && !hideSettings && (
              <button
                type="button"
                onClick={() => { onClose?.(); navigate('/profil?tab=settings'); }}
                aria-label="Profil ayarları"
                className="flex h-9 w-9 items-center justify-center rounded-full border text-white"
                style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
    </header>
  );

  const content = loading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: palette.accent }} />
          </div>
        ) : accountState && !banned ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AccountStatusMark status={accountState.status} />
            <h2 className="mt-4 text-lg font-black text-white">{accountState.name}</h2>
            <p className="mx-auto mt-2 max-w-[300px] text-xs leading-snug text-white/70">{accountState.message}</p>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <ProfileHeroBlock
                name={shownName}
                avatar={banned ? ACCOUNT_STATES.banned.image : shownAvatar}
                frame={hidden || banned ? '' : (profile?.profile_frame || frame)}
                frameScale={profile?.profile_frame_scale || frameScale}
                palette={palette}
                hidden={hidden}
                statusLabel={banned ? ACCOUNT_MARKS.banned : ''}
                roleLabel={hidden ? '' : (profile?.title || profile?.display_role || '')}
              />
            </div>

            {!hidden && (profile?.broadcaster_status === 'active' || profile?.agency_name || ownerAgency) && (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                {profile?.broadcaster_status === 'active' && (
                  <span className="flex items-center gap-1 rounded-full border border-[#F5C542]/50 bg-[#F5C542]/10 px-3 py-1 text-[11px] font-black text-[#F5C542]">
                    <Mic2 className="h-3 w-3" /> 🎤 YAYINCI
                  </span>
                )}
                {/* Asistan etiketi: kadınlarda pembe, erkeklerde mavi. */}
                {profile?.agency_role === 'assistant' && (
                  <span
                    className="flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-black"
                    style={{ borderColor: palette.accent, background: palette.soft, color: palette.accent }}
                  >
                    🤝 ASİSTAN
                  </span>
                )}
                {ownerAgency ? (
                  <span className="flex items-center gap-1 rounded-full border border-[#F5C542]/60 bg-[#F5C542]/10 px-3 py-1 text-[11px] font-black text-[#F5C542]">
                    <Building2 className="h-3 w-3" /> 🏢 AJANS SAHİBİ{ownerAgency.name ? ` • ${ownerAgency.name}` : ''}{ownerAgency.code ? ` (${ownerAgency.code})` : ''}
                  </span>
                ) : profile?.agency_name ? (
                  <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-[11px] font-semibold text-white/70">Ajans: {profile.agency_name}</span>
                ) : null}
              </div>
            )}

            <ProfileStatsRow
              palette={palette}
              // 1000, yöneticilere sabitlenen yapay en üst seviyedir: kartta gösterilmez.
              level={level >= 1000 ? 0 : level}
              receivedLevel={profile?.gift_received_level || 0}
              receivedTier={profile?.gift_received_tier}
              nLevel={profile?.n_level || 0}
              vipLevel={profile?.vip_level || 0}
            />

            {hidden ? (
              <p className="mt-5 rounded-2xl border px-4 py-3 text-center text-[11px] leading-snug text-white/70" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.5)' }}>
                Kullanıcı, özel Gizli Kullanıcı modunu etkinleştirdi. Kimlik bilgileri gizli kalır.
              </p>
            ) : (
              <ProfileIdentityBlock
                palette={palette}
                genderLabel={genderLabel}
                age={age}
                country={badge.country}
                flag={badge.flag}
                memberId={memberId}
                joinDate={formatDate(profile?.created_date)}
                copied={copied}
                onCopyId={copyId}
              />
            )}

            {!hidden && info.length > 0 && (
              <div className="mt-5 space-y-1.5 rounded-2xl border px-4 py-3 text-[12px]" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
                {info.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-3">
                    <span className="shrink-0 text-white/55">{row.label}</span>
                    <span className="min-w-0 break-words text-right font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            )}

            {showSocial && (
              <div className="mt-5 space-y-3">
                <FollowButton userId={userId} accent={palette.accent} />
                {relation !== 'friend' && (
                  <button
                    type="button"
                    onClick={addFriend}
                    disabled={relation === 'pending'}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black text-white disabled:opacity-60"
                    style={{ borderColor: palette.accent, background: palette.soft, boxShadow: `0 0 22px -6px ${palette.glow}` }}
                  >
                    <UserPlus className="h-5 w-5" /> {relation === 'pending' ? 'İstek Gönderildi' : 'Arkadaş Ekle'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { onMessage?.(userId); onClose?.(); }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black text-white"
                  style={{ borderColor: palette.accent2, background: 'rgba(0,0,0,0.5)', boxShadow: `0 0 22px -8px ${palette.glow}` }}
                >
                  <MessageSquare className="h-5 w-5" /> Mesaj Yaz
                </button>
                {canInvite && (
                  <button
                    type="button"
                    onClick={inviteBroadcaster}
                    disabled={inviteSent}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3.5 text-base font-black text-white disabled:opacity-60"
                    style={{ borderColor: '#F5C542', background: 'rgba(245,197,66,0.14)', boxShadow: '0 0 22px -8px rgba(245,197,66,0.95)' }}
                  >
                    <Mic2 className="h-5 w-5" /> {inviteSent ? 'Davet Gönderildi' : 'Yayıncı Olarak Davet Et'}
                  </button>
                )}
              </div>
            )}

            {tiles.length > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-x-2 gap-y-3 rounded-2xl border px-3 py-4" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
                {tiles.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.disabled}
                    onClick={item.onClick}
                    className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-[11px] font-semibold text-white/85 active:scale-95 disabled:opacity-35"
                  >
                    <item.icon className="h-6 w-6" strokeWidth={1.75} />
                    <span className="max-w-full text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {footer.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.45)' }}>
                {footer.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-center gap-3 border-b px-4 py-3.5 text-left text-sm font-bold"
                    style={{ borderColor: palette.soft, color: item.danger ? palette.danger : '#fff' }}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={2} />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-white/40" />
                  </button>
                ))}
              </div>
            )}

    </>
  );

  // Yarı yükseklik modu: kart alttan yukarı kayarak açılır ve ekranın yarısını kaplar.
  if (sheet) {
    return (
      <div className="fixed inset-0 z-[300]">
        <button type="button" aria-label="Kapat" onClick={onClose} className="absolute inset-0 w-full bg-black/60" />
        <div
          className="animate-sheet-up absolute inset-x-0 bottom-0 flex h-[50vh] flex-col overflow-hidden rounded-t-[28px] border-t-2 shadow-[0_-8px_30px_rgba(0,0,0,0.55)]"
          style={{ background: palette.bg, borderColor: palette.soft }}
        >
          <div className="flex shrink-0 justify-center pb-1 pt-2.5">
            <span className="h-1.5 w-12 rounded-full" style={{ background: palette.soft }} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto w-full max-w-[520px]">
              {header}
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain" style={{ background: palette.bg }}>
      <div className="relative mx-auto flex min-h-full w-full max-w-[520px] flex-col px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        {header}
        {content}
      </div>
    </div>
  );
}