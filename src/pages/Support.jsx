import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import usePageScrollLock from '@/hooks/usePageScrollLock';
import { Image } from '@/components/ui/image';
import SupportComposer from '@/components/support/SupportComposer';
import SupportChatHeader from '@/components/support/SupportChatHeader';
import SupportChatMessage from '@/components/support/SupportChatMessage';
import useChatViewport from '@/hooks/useChatViewport';
import '@/components/support/supportChat.css';
import useAgOfficial from '@/hooks/useAgOfficial';


/**
 * Canlı destek: üye konu/kategori seçmeden doğrudan yazar. İlk mesajla görüşme
 * otomatik açılır; yönetici görüşmeyi kapatırsa sonraki mesaj yeni görüşme başlatır.
 */
export default function Support() {
  const { user } = useCurrentUser();
  const official = useAgOfficial(user?.id);
  const staff = user?.role === 'admin' || official.active;
  const { toast } = useToast();
  const navigate = useNavigate();
  // Özel sohbetteki gibi: klavye açılınca panel yukarı kayar.
  const frame = useRef(null);
  useChatViewport(frame);
  // Arkadaki sayfa ve tema çekme/kaydırmada oynamaz.
  usePageScrollLock();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  // Yönetici konuyu kapatınca görüşme silinir: son hâli ve "sonlandırıldı" uyarısı ekranda kalır.
  const [closedMessages, setClosedMessages] = useState([]);
  const [closedNotice, setClosedNotice] = useState(false);
  const [closedUntil, setClosedUntil] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const messagesRef = useRef([]);
  const seenKey = user ? `destek-okundu:${user.id}` : '';
  const conversationKey = user ? `destek-gorusme:${user.id}` : '';
  const markSeen = () => {
    if (!seenKey) return;
    localStorage.setItem(seenKey, new Date().toISOString());
    // Alt menüdeki canlı destek rozeti anında sıfırlanır.
    window.dispatchEvent(new Event('destek-goruldu'));
  };

  // Silinme olayları geldiğinde kapanan görüşme kaybolmasın diye son dolu mesaj listesi tutulur.
  useEffect(() => { if (messages.length) messagesRef.current = messages; }, [messages]);
  useEffect(() => { if (ticket?.id) markSeen(); }, [ticket?.id]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const rows = await base44.entities.SupportTicket.filter({ user_id: user.id }, '-created_date', 1);
      if (!alive) return;
      const latest = rows?.[0];
      const expired = latest?.status === 'closed' && Date.parse(latest.delete_after || '') <= Date.now();
      if (!latest || expired) {
        setTicket(null); setMessages([]); setClosedMessages([]);
        if (localStorage.getItem(conversationKey)) { setClosedNotice(true); localStorage.removeItem(conversationKey); }
        return;
      }
      setTicket(latest);
      if (latest.status === 'closed') {
        setClosedNotice(true); setClosedUntil(latest.delete_after);
      } else {
        setClosedNotice(false); setClosedUntil(null); localStorage.setItem(conversationKey, '1');
      }
    };
    load();
    const poll = setInterval(load, 3000);
    return () => { alive = false; clearInterval(poll); };
  }, [user?.id]);

  useEffect(() => {
    if (!closedUntil) return;
    const timeout = setTimeout(() => {
      setMessages([]); setClosedMessages([]); messagesRef.current = [];
      setTicket(current => current?.status === 'closed' ? null : current);
      setClosedUntil(null);
    }, Math.max(0, Date.parse(closedUntil) - Date.now()));
    return () => clearTimeout(timeout);
  }, [closedUntil]);

  useEffect(() => {
    if (!ticket) return undefined;
    let alive = true;
    const loadMessages = () => base44.entities.SupportMessage.filter({ ticket_id: ticket.id }, 'created_date', 200)
      .then((m) => { if (alive) { setMessages(m); setTimeout(() => endRef.current?.scrollIntoView(), 50); } });
    loadMessages();
    const poll = setInterval(loadMessages, 3000);
    const unsubMsg = subscribeEntity('SupportMessage', (ev) => {
      if (ev.data?.ticket_id !== ticket.id) return;
      if (ev.type === 'create') {
        setMessages((p) => (p.some((m) => m.id === ev.data.id) ? p : [...p, ev.data]));
        markSeen();
        setTimeout(() => endRef.current?.scrollIntoView(), 50);
      }
      if (ev.type === 'delete') setMessages((p) => p.filter((m) => m.id !== ev.data.id));
    });
    // Yönetici görüşmeyi kapatıp silerse son hâli korunur; yazma alanının üstünde uyarı çıkar.
    const unsubTicket = subscribeEntity('SupportTicket', (ev) => {
      if ((ev.data?.id || ev.id) !== ticket.id) return;
      if (ev.type === 'update' && ev.data?.status === 'closed') {
        setTicket(current => ({ ...current, ...ev.data }));
        setClosedNotice(true); setClosedUntil(ev.data.delete_after);
      }
      if (ev.type === 'delete') {
        setMessages([]); setClosedMessages([]); messagesRef.current = [];
        setTicket(null); setClosedNotice(true);
        localStorage.removeItem(conversationKey);
      }
    });
    return () => { alive = false; clearInterval(poll); unsubMsg(); unsubTicket(); };
  }, [ticket?.id]);



  // Yöneticiye anlık bildirim: yeni görüşme ya da yeni mesaj.
  const notifyAdmin = (msg, isNew, bodyText) => base44.functions.invoke('admin-notify', {
    event: isNew ? 'support' : 'support_message',
    ref_id: `support_msg:${msg?.id || Date.now()}`,
    title: isNew ? 'Yeni destek talebi geldi' : 'Yeni destek mesajı geldi',
    body: `${user.username || user.full_name}: ${String(bodyText).slice(0, 80)}`,
    link: '/admin/destek',
    telegram_data: {
      username: user.username || user.full_name,
      subject: ticket?.subject || '',
      message: String(bodyText).slice(0, 200),
      date: new Date().toLocaleString('tr-TR'),
    },
  }).catch(() => {});

  const push = async (payload) => {
    if (!user || sending) return;
    setSending(true);
    try {
      const { data } = await base44.functions.invoke('officialSupport', { action: 'sendMember', ...payload });
      const active = data.ticket, msg = data.message, isNew = data.is_new;
      setTicket(active);
      if (msg?.id) {
        // Yeni görüşme başlıyorsa kapanmış görüşmenin izleri temizlenir.
        if (isNew) { setMessages([msg]); setClosedMessages([]); setClosedNotice(false); setClosedUntil(null); }
        else setMessages((p) => (p.some((m) => m.id === msg.id) ? p : [...p, msg]));
        setTimeout(() => endRef.current?.scrollIntoView(), 60);
        if (active?.id) localStorage.setItem(conversationKey, '1');
        markSeen();
        notifyAdmin(msg, isNew, payload.text || 'Ek gönderildi');
      }
      return true;
    } catch {
      toast({ title: 'Mesaj gönderilemedi', variant: 'destructive' });
      return false;
    } finally { setSending(false); }
  };

  if (!user) return <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Yükleniyor...</div>;

  const thread = messages;

  // Özel sohbet gibi tam ekran panel: alt menünün üzerini kaplar, geri okuyla kapanır.
  return (
    <div ref={frame} className="support-chat fixed inset-x-0 z-[250] flex min-h-0 flex-col overflow-hidden overscroll-none" style={{ top: 'var(--viewport-offset, 0px)', height: 'var(--visual-viewport-height, 100dvh)' }}>
      <SupportChatHeader onBack={() => window.history.length > 1 ? navigate(-1) : navigate('/')} />

        <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden overscroll-contain p-3" style={{ touchAction: 'pan-y' }}>
          {thread.length === 0 && !closedNotice && (
            <p className="px-4 pt-6 text-center text-xs text-muted-foreground">
              Merhaba! Sorununuzu buradan doğrudan yazabilir, fotoğraf veya 30 saniyelik video gönderebilirsiniz.
            </p>
          )}
          {thread.map(m => <SupportChatMessage key={m.id} message={m} memberName={user.username || user.full_name || 'Üye'} memberAvatar={user.avatar} onImageClick={setLightbox} />)}
          <div ref={endRef} />
        </div>

        {/* Yönetici konuyu kapattığında yazma alanının üstünde görüşmenin kapandığı yazar. */}
        {closedNotice && !staff && !official.loading && (
          <p className="border-t border-[#f2ce6b]/25 bg-[#f2ce6b]/10 px-4 py-2 text-center text-[11px] font-semibold text-[#f2ce6b]">
            Konu kapandı. Mesajlar bir dakika sonra silinir. Yazdığınızda yeni bir görüşme başlar.
          </p>
        )}

        <SupportComposer
          busy={sending}
          onSendText={(text) => push({ text })}
          onSendMedia={(file_url, media_type) => push({ text: '', file_url, media_type })}
        />

      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[300] flex items-center justify-center bg-background/95 p-4">
          <button className="absolute right-4 top-4 p-2 text-white"><X className="h-6 w-6" /></button>
          <Image src={lightbox} className="max-h-full max-w-full rounded-lg" fittingType="fit" />
        </div>
      )}
    </div>
  );
}