import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Headset, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useKeyboardInset from '@/hooks/useKeyboardInset';
import { Image } from '@/components/ui/image';
import SupportAttachment from '@/components/support/SupportAttachment';
import SupportComposer from '@/components/support/SupportComposer';
import { statusLabel, STATUS_COLORS } from '@/lib/supportStatus';

/** İlk mesaj görüşmenin konusu olur: yönetici panelinde sohbet bununla listelenir. */
const subjectFrom = (text, mediaType) =>
  text ? text.slice(0, 60) : mediaType === 'video' ? '🎥 Video' : '📷 Fotoğraf';

/**
 * Canlı destek: üye konu/kategori seçmeden doğrudan yazar. İlk mesajla görüşme
 * otomatik açılır; yönetici görüşmeyi kapatırsa sonraki mesaj yeni görüşme başlatır.
 */
export default function Support() {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  // Özel sohbetteki gibi: klavye açılınca panel yukarı kayar.
  const keyboardInset = useKeyboardInset();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lightbox, setLightbox] = useState(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    base44.entities.SupportTicket.filter({ user_id: user.id }, '-created_date', 1)
      .then((t) => setTicket(t?.[0] || null))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!ticket) return undefined;
    base44.entities.SupportMessage.filter({ ticket_id: ticket.id }, 'created_date', 200)
      .then((m) => { setMessages(m); setTimeout(() => endRef.current?.scrollIntoView(), 50); })
      .catch(() => {});
    const unsubMsg = subscribeEntity('SupportMessage', (ev) => {
      if (ev.data?.ticket_id !== ticket.id) return;
      if (ev.type === 'create') {
        setMessages((p) => (p.some((m) => m.id === ev.data.id) ? p : [...p, ev.data]));
        setTimeout(() => endRef.current?.scrollIntoView(), 50);
      }
      if (ev.type === 'delete') setMessages((p) => p.filter((m) => m.id !== ev.data.id));
    });
    // Yönetici görüşmeyi kapatıp silerse sohbet temizlenir; sonraki mesaj yeni görüşme açar.
    const unsubTicket = subscribeEntity('SupportTicket', (ev) => {
      if (ev.data?.id !== ticket.id) return;
      if (ev.type === 'delete' || (ev.type === 'update' && ev.data?.status === 'closed')) {
        setMessages([]);
        setTicket(null);
      }
    });
    return () => { unsubMsg(); unsubTicket(); };
  }, [ticket?.id]);

  /** Görüşme yoksa ilk mesajla birlikte açılır: üye konu seçmez. */
  const ensureTicket = async (subject) => {
    if (ticket) {
      if (ticket.status !== 'answered' && ticket.status !== 'closed') {
        base44.entities.SupportTicket.update(ticket.id, { status: 'reviewing' }).catch(() => {});
        setTicket({ ...ticket, status: 'reviewing' });
      }
      return ticket;
    }
    const created = await base44.entities.SupportTicket.create({
      user_id: user.id,
      user_name: user.username || user.full_name,
      subject,
      category: 'Genel',
      status: 'reviewing',
    });
    setTicket(created);
    return created;
  };

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
      const isNew = !ticket;
      const active = await ensureTicket(isNew ? subjectFrom(payload.text, payload.media_type) : ticket.subject);
      const msg = await base44.entities.SupportMessage.create({ ticket_id: active.id, owner_id: user.id, user_id: user.id, sender: 'user', ...payload });
      if (msg?.id) {
        setMessages((p) => (p.some((m) => m.id === msg.id) ? p : [...p, msg]));
        setTimeout(() => endRef.current?.scrollIntoView(), 60);
        notifyAdmin(msg, isNew, payload.text || 'Ek gönderildi');
      }
    } catch {
      toast({ title: 'Mesaj gönderilemedi', variant: 'destructive' });
    }
    setSending(false);
  };

  if (!user) return <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">Yükleniyor...</div>;

  // Özel sohbet gibi tam ekran panel: alt menünün üzerini kaplar, geri okuyla kapanır.
  return (
    <div
      className="standalone-private-chat dark fixed inset-0 z-[60] flex min-h-0 flex-col overflow-hidden bg-anthracite text-white"
      style={{ transform: keyboardInset ? `translateY(-${keyboardInset}px)` : undefined, transition: 'transform 180ms ease-out' }}
    >
      <div className="flex items-center gap-2.5 border-b border-[#f2ce6b]/25 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)]">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          aria-label="Geri"
          className="shrink-0 p-1 text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #c62828, #f2ce6b)' }}>
          <Headset className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Canlı Destek</p>
          <p className="text-[11px] text-green-400">● Çevrimiçi — hemen yazabilirsiniz</p>
        </div>
        {ticket && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[ticket.status] || ''}`}>{statusLabel(ticket.status)}</span>}
      </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {messages.length === 0 && (
            <p className="px-4 pt-6 text-center text-xs text-muted-foreground">
              Merhaba! Sorununuzu buradan doğrudan yazabilir, fotoğraf veya 30 saniyelik video gönderebilirsiniz.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.user_id === m.owner_id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] overflow-hidden rounded-2xl px-3 py-2 text-sm ${m.user_id === m.owner_id ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                <SupportAttachment message={m} className="mb-1 max-h-48 max-w-full rounded-lg" onImageClick={setLightbox} />
                {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <SupportComposer
          busy={sending}
          onSendText={(text) => push({ text })}
          onSendMedia={(file_url, media_type) => push({ text: '', file_url, media_type })}
        />

      {lightbox && (
        <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4">
          <button className="absolute right-4 top-4 p-2 text-white"><X className="h-6 w-6" /></button>
          <Image src={lightbox} className="max-h-full max-w-full rounded-lg" fittingType="fit" />
        </div>
      )}
    </div>
  );
}