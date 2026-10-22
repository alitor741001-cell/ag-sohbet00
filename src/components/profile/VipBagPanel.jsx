import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Gift, Loader2, Send, Sparkles, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ProfileFrame from '@/components/ProfileFrame';
import UserStatusBadges from '@/components/status/UserStatusBadges';
import VipCosmeticsBag from '@/components/profile/VipCosmeticsBag';
import useVipCosmetics from '@/hooks/useVipCosmetics';
import { vipStyle } from '@/lib/userLevels';

/**
 * Mavi Çanta: coin yüklemesinden kazanılan VIP'ler burada bekler.
 * Kişi isterse kendisi kullanır (profilinde anında aktif olur), isterse
 * kimlik numarasıyla bir arkadaşına gönderir — gönderilen VIP alıcıda anında aktif olur.
 */
export default function VipBagPanel({ open, onClose, onChanged }) {
  const { groups: cosmeticGroups, level: cosmeticLevel, busy: cosmeticBusy, error: cosmeticError, toggle: toggleCosmetic, refresh: refreshCosmetics } = useVipCosmetics(open);
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [sendItemId, setSendItemId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [person, setPerson] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lookupError, setLookupError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('vip-bag', { action: 'list' });
      setItems(response.data?.items || []);
      setHistory(response.data?.history || []);
    } catch {
      setItems([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setNotice('');
    setConfirm(null);
    setSendItemId('');
    setMemberId('');
    setPerson(null);
    setLookupError('');
    load();
  }, [open, load]);

  // Kimlik numarası yazıldıkça alıcının profili altında görünür (hediye kutusuyla aynı arama).
  useEffect(() => {
    if (!open) return undefined;
    const query = memberId.trim();
    setPerson(null);
    if (query.length < 5) {
      setLookupError('');
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await base44.functions.invoke('gift-box', { action: 'lookup', member_id: query });
        if (cancelled) return;
        const data = response.data || {};
        setPerson(data.person ? { ...data.person, self: !!data.self } : null);
        setLookupError('');
      } catch (error) {
        if (cancelled) return;
        setPerson(null);
        setLookupError(error?.response?.data?.error || 'Üye bulunamadı.');
      }
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [memberId, open]);

  // Alıcının profili (çerçevesi, rozetleri ve ismi) numara yazıldığında altında görünür.
  useEffect(() => {
    if (!person?.user_id) {
      setProfile(null);
      return undefined;
    }
    let cancelled = false;
    base44.functions.invoke('user-profile', { user_id: person.user_id })
      .then((response) => { if (!cancelled) setProfile(response.data || null); })
      .catch(() => { if (!cancelled) setProfile(null); });
    return () => { cancelled = true; };
  }, [person?.user_id]);

  const activeItem = items.find((item) => item.id === sendItemId) || null;
  const recipientName = profile?.username || profile?.full_name || person?.name || '';

  const useItem = async () => {
    if (!confirm?.item) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await base44.functions.invoke('vip-bag', { action: 'use', item_id: confirm.item.id });
      const data = response.data || {};
      setNotice(`VIP${data.level} aktif edildi (${data.days} gün) — rozetin artık profilinde görünüyor.`);
      await load();
      await refreshCosmetics();
      window.dispatchEvent(new Event('vip-cosmetics-changed'));
      onChanged?.();
    } catch (error) {
      setNotice(error?.response?.data?.error || 'VIP kullanılamadı.');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const sendItem = async () => {
    if (!person || !activeItem) return;
    setBusy(true);
    setNotice('');
    try {
      const response = await base44.functions.invoke('vip-bag', {
        action: 'send',
        item_id: activeItem.id,
        member_id: person.member_id || memberId.trim(),
      });
      const data = response.data || {};
      setNotice(`VIP${data.level} ${data.recipient_name || person.name} hesabına gönderildi — anında aktif oldu.`);
      setSendItemId('');
      setMemberId('');
      setPerson(null);
      await load();
      await refreshCosmetics();
      window.dispatchEvent(new Event('vip-cosmetics-changed'));
      onChanged?.();
    } catch (error) {
      setNotice(error?.response?.data?.error || 'Gönderilemedi.');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-[#0F0F14] text-white">
      <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-transform active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="flex min-w-0 items-center gap-2 text-sm font-bold text-white">
          <Sparkles className="h-4 w-4 shrink-0 text-sky-400" /> <span className="truncate">Mavi Çanta</span>
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-[430px]">
          <p className="text-[11px] leading-relaxed text-white/55">
            Coin yüklemesinden gelen VIP'ler burada bekler. İstersen kendin kullan, istersen kimlik numarasıyla bir
            arkadaşına gönder — gönderdiğin VIP alıcıda anında aktif olur.
          </p>

          <VipCosmeticsBag groups={cosmeticGroups} level={cosmeticLevel} busy={cosmeticBusy} onToggle={toggleCosmetic} error={cosmeticError} />

          {loading && !items.length ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-sky-400" /></div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/50">Çantan boş — 1M+ coin yüklediğinde VIP buraya gelir.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {items.map((item) => {
                const style = vipStyle(item.level);
                const sending = sendItemId === item.id;
                return (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="shrink-0 rounded-xl border px-2.5 py-1.5 text-sm font-extrabold tabular-nums"
                        style={{ background: style.background, borderColor: style.border, color: style.color }}
                      >
                        VIP{item.level}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{item.duration_label} geçerli</p>
                        <p className="truncate text-[10px] text-white/45">
                          {item.sender_name ? `${item.sender_name} gönderdi` : 'Coin yüklemesinden geldi'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirm({ kind: 'use', item })}
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <UserCheck className="h-4 w-4" /> Kendim kullan
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => { setSendItemId(sending ? '' : item.id); setNotice(''); }}
                        className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-50"
                      >
                        <Gift className="h-4 w-4" /> Gönder
                      </button>
                    </div>

                    {sending && (
                      <div className="mt-2.5 rounded-xl bg-black/25 p-2.5">
                        <input
                          value={memberId}
                          onChange={(event) => setMemberId(event.target.value)}
                          inputMode="numeric"
                          placeholder="Alıcının üye numarası"
                          className="h-11 w-full rounded-xl bg-white/10 px-3 text-sm font-semibold text-white outline-none placeholder:text-white/35"
                        />
                        {person && (
                          <div className="mt-2 rounded-xl bg-white/5 p-2.5">
                            <p className="text-[10px] font-semibold text-white/45">Alıcı</p>
                            <div className="mt-1.5 flex items-center gap-2.5">
                              <ProfileFrame
                                frame={profile?.profile_frame || ''}
                                avatar={profile?.avatar || person.avatar}
                                name={recipientName}
                                size="sm"
                                frameScale={profile?.profile_frame_scale || 100}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">{recipientName}</p>
                                <p className="text-[10px] text-white/45">Üye No: {person.member_id || '—'}</p>
                                <UserStatusBadges
                                  className="justify-start"
                                  n_level={profile?.n_level || 0}
                                  vip_level={profile?.vip_level || 0}
                                  vip_days_left={profile?.vip_days_left || 0}
                                  gift_sent_level={profile?.gift_sent_level || 0}
                                  gift_sent_tier={profile?.gift_sent_tier || 'green'}
                                  gift_received_level={profile?.gift_received_level || 0}
                                  gift_received_tier={profile?.gift_received_tier || 'green'}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {lookupError && <p className="mt-1.5 text-[11px] font-semibold text-amber-400">{lookupError}</p>}
                        <button
                          type="button"
                          disabled={!person || busy || person.self}
                          onClick={() => setConfirm({ kind: 'send', item })}
                          className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-sky-500 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-40"
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} VIP{item.level} gönder
                        </button>
                        {person?.self && (
                          <p className="mt-1.5 text-[10px] text-white/50">
                            Kendi numaranı girdin — "Kendim kullan" düğmesiyle aktif edebilirsin.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {notice && <p className="mt-3 text-center text-[11px] font-semibold text-emerald-400">{notice}</p>}

          {history.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold text-white/60">Son hareketler</p>
              <div className="mt-2 space-y-1.5">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-2">
                    <p className="truncate text-[11px] font-semibold text-white/70">
                      VIP{item.level} · {item.status === 'sent' ? `${item.recipient_name || '—'} kişisine gönderildi` : 'kendin kullandın'}
                    </p>
                    <span className="shrink-0 text-[10px] text-white/40">{String(item.created_date || '').slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <ConfirmDialog
            open={!!confirm}
            onOpenChange={(next) => { if (!next) setConfirm(null); }}
            title={confirm?.kind === 'send' ? 'VIP gönderimi' : 'VIP kullanımı'}
            description={confirm?.kind === 'send'
              ? `VIP${confirm?.item?.level} (${confirm?.item?.duration_label}) ${recipientName || 'alıcıya'} gönderilecek ve anında aktif olacak.`
              : `VIP${confirm?.item?.level} (${confirm?.item?.duration_label}) profiline işlenecek; süre kalan günlerinin üstüne eklenecek.`}
            confirmText="Onayla"
            onConfirm={confirm?.kind === 'send' ? sendItem : useItem}
          />
        </div>
      </div>
    </div>
  );
}