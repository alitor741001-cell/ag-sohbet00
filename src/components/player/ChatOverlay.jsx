import { useState, useEffect, useRef } from 'react';
import useRoomTyping from '@/components/data/useRoomTyping';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { Clock, Crown, Eye, Image as ImageIcon, LayoutGrid, MessageSquare, MessageSquareOff, MessagesSquare, Send, Shield, Smile, Sparkles, Users, X } from 'lucide-react';
import { neonCircleClass } from '@/lib/neonStyle';
import VoiceControls from '@/components/player/VoiceControls';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';

import useMessageProfiles from '@/hooks/useMessageProfiles';
import { isHiddenName } from '@/lib/hiddenUser';
import { parseLevelUpNotice } from '@/lib/levelUpNotice';
import { mergeMessages, upsertMessage } from '@/lib/realtimeMessages';
import { parseRoleMetadata, parseFrameMetadata } from '@/lib/roles';
import RoomChatMessage from '@/components/player/RoomChatMessage';
import RoomCheatNotice from '@/components/player/RoomCheatNotice';
import EmojiPicker from '@/components/player/EmojiPicker';
import RoomSettingsContent from '@/components/player/RoomSettingsContent';
import ParticipantHistoryPanel from '@/components/player/ParticipantHistoryPanel';




// Sohbet sekme şeridi: referanstaki gibi ikon + etiket.
const FILTERS = [
  { key: 'all', label: 'Tümü', icon: LayoutGrid },
  { key: 'yetkililer', label: 'Yetkililer', icon: Shield },
  { key: 'izleyici', label: 'İzleyici', icon: Eye },
  { key: 'yonetici', label: 'Yönetici', icon: Users },
];

export default function ChatOverlay({ roomId, chatEnabled, chatLocked = false, isOwner, isAdmin, onClose, autoDeleteMinutes = 0, countdownText = '', clearToken = 0, onSetAutoDelete, voice, voiceEnabled, onSettings, onDirect, onDirectUser, directUnread = 0, ownerId, roomModerators = [], participants = [], recentParticipants = [], viewerProfiles = {}, presenceMap = {}, onProfileCard, settingsProps, levels = {}, onToggleChat, onMicPress }) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  // Cheat temizleme işaretçisi: oda için ortak zaman damgası; bu andan eski bildirimler gizlenir.
  const [cheatClearedAt, setCheatClearedAt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  const [lightbox, setLightbox] = useState(null);
  const [showAutoDeleteMenu, setShowAutoDeleteMenu] = useState(false);
  const [msgFilter, setMsgFilter] = useState('all');
  // Gizli kullanıcıların takma adı → kimliği: yalnızca N/VIP rozetleri için seviye verisi çekilir, kimlik gösterilmez.
  const hiddenUsersByName = {};
  participants.forEach((person) => { if (person?.user_id && isHiddenName(person.name)) hiddenUsersByName[person.name] = person.user_id; });
  const scrollRef = useRef(null);
  const profiles = useMessageProfiles([...messages.map((message) => message.user_id), ...Object.values(hiddenUsersByName)]);
  const [roomMods, setRoomMods] = useState([]);
  useEffect(() => {
    if (!ownerId) return;
    base44.entities.RoomMod.filter({ owner_id: ownerId }, 'created_date', 100)
      .then((mods) => setRoomMods(mods))
      .catch(() => {});
    const unsub = subscribeEntity('RoomMod', (ev) => {
      if (ev.data?.owner_id !== ownerId) return;
      base44.entities.RoomMod.filter({ owner_id: ownerId }, 'created_date', 100)
        .then((mods) => setRoomMods(mods))
        .catch(() => {});
    });
    return unsub;
  }, [ownerId]);
  const { typingUsers, sendTyping } = useRoomTyping(roomId, user);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const isHiddenMarker = (m) => {
    const t = m?.text || '';
    if (m?.type !== 'system') return false;
    if (/odaya katıldı|odadan ayrıldı/.test(t)) return false;
    return /\{\{(?:[A-Z_]+_WELCOME|PFRAME\||ROLE\||FRAME\||CHEAT\|)/.test(t);
  };
  // Cheat temizleme işaretçisi: temizlemenin yapıldığı an — oda için ortak zaman.
  const cheatMarkerTime = (m) => {
    const match = /\{\{CHEAT\|(\d+)\}\}/.exec(m?.text || '');
    return match ? Number(match[1]) : 0;
  };
  const isCheatClearNotice = (m) => m?.type === 'system' && /cheati temizledi/i.test(m?.text || '');
  // Odaya girmeden önce yazılmış mesajlar gösterilmez: ilk okuma yalnızca bu eski
  // mesajların kimliklerini işaretler, sohbet giriş anından itibaren akar.
  const preEntryIds = useRef(new Set());
  const seededRef = useRef(false);
  const load = () => {
    base44.entities.RoomMessage.filter({ room_id: roomId }, '-created_date', 200)
      .then((r) => {
        setCheatClearedAt((current) => r.reduce((max, m) => Math.max(max, cheatMarkerTime(m)), current || 0));
        const visible = r.filter((m) => !isHiddenMarker(m));
        if (!seededRef.current) {
          seededRef.current = true;
          visible.forEach((m) => preEntryIds.current.add(m.id));
          setLoading(false);
          return;
        }
        setMessages((current) => mergeMessages(current, visible.filter((m) => !preEntryIds.current.has(m.id))));
        setLoading(false); setTimeout(scrollToBottom, 100);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const unsub = subscribeEntity('RoomMessage', (ev) => {
      if (ev.data?.room_id !== roomId) return;
      if (ev.type === 'delete') { setMessages((prev) => prev.filter((message) => message.id !== ev.id)); return; }
      const markerAt = cheatMarkerTime(ev.data);
      if (markerAt) { setCheatClearedAt((current) => Math.max(current || 0, markerAt)); return; }
      if (isHiddenMarker(ev.data)) return;
      if (isCheatClearNotice(ev.data)) {
        // Sohbeti temizleyen kişi herkeste aynı anda temizler: bu andan eski mesajlar kalkar.
        const at = new Date(ev.data.created_date || Date.now()).getTime();
        setMessages((prev) => [...prev.filter((m) => new Date(m.created_date || 0).getTime() > at), ev.data]);
      } else setMessages((prev) => upsertMessage(prev, ev.data));
      setTimeout(scrollToBottom, 50);
    });
    const reconnect = () => load();
    window.addEventListener('online', reconnect);
    // Canlı akış aksarsa mesajlar yine de görünsün: sekme görünürken kısa aralıklarla tazelenir.
    const poll = setInterval(() => { if (document.visibilityState !== 'hidden') load(); }, 60000);
    return () => { unsub(); window.removeEventListener('online', reconnect); clearInterval(poll); };
  }, [roomId]);

  // Otomatik silme süresi doldğunda açık panelde anlık temizle
  useEffect(() => {
    if (clearToken > 0) {
      setMessages([]);
      setLoading(false);
    }
  }, [clearToken]);

  const send = async (e) => {
    e?.preventDefault();
    if (chatLocked) { toast({ title: 'Sohbet yasağı var', description: 'Yazmak için bir koltuğa otur.', variant: 'destructive' }); return; }
    const messageText = text.trim();
    if (!messageText || !user || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setText(''); setShowEmoji(false);
    try {
      // Yalnızca sunucunun kaydettiği kimlik ve mesaj gösterilir; gerçek profilli geçici kopya oluşturulmaz.
      const response = await base44.functions.invoke('send-room-message', { room_id: roomId, text: messageText });
      if (response.data?.message) setMessages((prev) => upsertMessage(prev, response.data.message));
      else load();
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setText((current) => current || messageText);
      toast({ title: 'Mesaj gönderilemedi', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const del = async (id) => {
    try { await base44.entities.RoomMessage.delete(id); setMessages((p) => p.filter((m) => m.id !== id)); }
    catch (err) { toast({ title: 'Silinemedi', variant: 'destructive' }); }
  };

  const clearAll = async () => {
    if (!confirm('Sohbetin tüm mesajlarını silmek istediğinize emin misiniz?')) return;
    try { await base44.functions.invoke('clear-room-messages', { room_id: roomId }); setMessages([]); toast({ title: 'Tüm mesajlar silindi' }); }
    catch (err) { toast({ title: 'Silinemedi', description: err.response?.data?.error || err.message, variant: 'destructive' }); }
  };



  const onPhoto = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(f.type)) { toast({ title: 'Sadece JPG, PNG, WEBP', variant: 'destructive' }); e.target.value = ''; return; }
    if (f.size > 10 * 1024 * 1024) { toast({ title: 'Maksimum 10 MB', variant: 'destructive' }); e.target.value = ''; return; }
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      await base44.functions.invoke('send-chat-image', { file_url, context: 'room', context_id: roomId, text: '' });
    } catch (err) {
      toast({ title: 'Görsel gönderilemedi', description: err.response?.data?.error || err.message, variant: 'destructive' });
    } finally { setUploading(false); e.target.value = ''; }
  };



  return (
    <div className="room-chat-shell flex h-full min-h-0 flex-col bg-black text-white">
      <div className="flex items-center justify-between gap-1.5 border-b border-[#FFD700]/30 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`relative h-9 w-9 shrink-0 ${neonCircleClass('gold')} text-[#FFD700]`}>
            <MessageSquare className="h-5 w-5" />
            <Crown className="absolute h-3 w-3" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight text-white">Sohbet {chatEnabled && <span className="text-xs text-[#A0A0A0] font-normal">({messages.length})</span>}</h3>
            <p className="truncate text-[10px] leading-tight text-white/45">Herkesle konuş, yeni dostluklar kur!</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isOwner && chatEnabled && (
            <div className="relative">
              <button onClick={() => setShowAutoDeleteMenu(!showAutoDeleteMenu)} className="flex items-center gap-1 whitespace-nowrap rounded-full border border-[#FFD700]/60 px-2.5 py-1 text-[11px] font-semibold text-[#FFD700] shadow-[0_0_12px_-5px_rgba(255,215,0,0.9)]"><Clock className="h-3 w-3" /> Oto-sil: {autoDeleteMinutes ? `${autoDeleteMinutes}dk` : 'Kapalı'}</button>
              {showAutoDeleteMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl border border-[#FFD700]/45 bg-[#0b0b0b] p-2 shadow-[0_0_18px_-4px_rgba(255,215,0,0.7)]">
                  <p className="text-xs text-[#A0A0A0] mb-1.5 text-center">Otomatik Silme Süresi</p>
                  <div className="grid grid-cols-3 gap-1">
                    <button onClick={() => { onSetAutoDelete?.(0); setShowAutoDeleteMenu(false); }} className={`px-1.5 py-1 rounded text-xs font-semibold ${!autoDeleteMinutes ? 'text-[#FFD700]' : 'text-[#A0A0A0] hover:bg-white/5'}`} style={!autoDeleteMinutes ? { background: 'rgba(255, 215, 0, 0.15)' } : {}}>Kapalı</button>
                    {[2,3,4,5,6,7,8,9,10].map((m) => (
                      <button key={m} onClick={() => { onSetAutoDelete?.(m); setShowAutoDeleteMenu(false); }} className={`px-1.5 py-1 rounded text-xs font-semibold ${autoDeleteMinutes === m ? 'text-[#FFD700]' : 'text-[#A0A0A0] hover:bg-white/5'}`} style={autoDeleteMinutes === m ? { background: 'rgba(255, 215, 0, 0.15)' } : {}}>{m}dk</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white active:scale-95"><X className="w-5 h-5" /></button>
        </div>
      </div>
      {(voiceEnabled || onSettings || onDirect) && (
        <div className="room-voice-bar flex items-center gap-1.5 border-b border-[#FFD700]/20 px-3 py-1.5">
          <VoiceControls voice={voice} onMic={onMicPress} />
          {onDirect && (
            <button onClick={onDirect} className="relative flex min-w-0 flex-1 items-center justify-center gap-1 rounded-full border border-[#8A2BE2]/55 bg-black/70 px-2 py-1 text-center shadow-[0_0_18px_-8px_rgba(138,43,226,0.9)] transition-transform active:scale-95">
              <MessagesSquare className="h-3.5 w-3.5 shrink-0 text-[#B06BFF]" />
              <span className="min-w-0 truncate text-[9px] font-black text-white">MESAJ YAZ</span>
              {directUnread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFD700] px-1 text-[9px] font-bold text-black">{directUnread > 99 ? '99+' : directUnread}</span>}
            </button>
          )}
        </div>
      )}
      {(chatEnabled || isOwner) && (
        <div className="room-chat-tabs mx-3 my-2 flex items-stretch overflow-x-auto rounded-2xl border border-[#FFD700]/40 bg-black py-1 no-scrollbar shadow-[0_0_16px_-6px_rgba(255,215,0,0.85)]" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          {FILTERS.map((f, index) => {
            const Icon = f.icon;
            const active = msgFilter === f.key;
            return (
              <button key={f.key} onClick={() => setMsgFilter(f.key)} className={`flex min-w-[3.75rem] flex-1 flex-col items-center gap-0.5 px-1.5 py-1 text-[9px] font-bold ${index > 0 ? 'border-l border-white/10' : ''} ${active ? 'rounded-lg bg-[#FFD700] text-black shadow-[0_0_14px_-3px_rgba(255,215,0,0.95)]' : 'text-white/80'}`}>
                <Icon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap leading-none">{f.label}</span>
              </button>
            );
          })}
        </div>
      )}
      {!chatEnabled && msgFilter === 'all' ? (
        isOwner ? (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center p-6 bg-black">
            <MessageSquareOff className="w-10 h-10 mb-3 text-[#A0A0A0]" />
            <p className="font-semibold text-white mb-3">Sohbet kapalı</p>
            <button onClick={onToggleChat} className="px-5 py-2.5 rounded-xl text-sm font-bold text-black" style={{ background: '#FFD700' }}>Sohbeti Aç</button>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center p-6 text-[#A0A0A0] bg-black">
            <MessageSquareOff className="w-10 h-10 mb-3" />
            <p className="font-semibold text-white">Sohbet kapalı</p>
            <p className="text-sm">Oda sahibi sohbeti kapatmış.</p>
          </div>
        )
      ) : msgFilter === 'all' ? (
      <div ref={scrollRef} className="flex min-w-0 flex-1 min-h-0 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain p-3 bg-black" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
        {loading ? <p className="text-center text-sm text-[#A0A0A0] py-8">Yükleniyor...</p> :
         messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-[#FFD700]/80" />
              <div className="relative max-w-xs rounded-2xl border-2 border-[#FFD700] bg-black/70 px-6 py-5 text-center shadow-[0_0_24px_-6px_rgba(255,215,0,0.9)]">
                <span className="absolute -top-3 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-[#FFD700] bg-black text-[#FFD700]">
                  <Crown className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm text-white/85">Henüz mesaj yok. İlk mesajı sen at! 🍿</p>
              </div>
              <Sparkles className="h-4 w-4 text-[#FFD700]/80" />
            </div>
          </div>
        ) :
         messages.filter((m) => !isHiddenMarker(m) && !(m.type === 'system' && (m.text || '').toLowerCase().includes('moderatör'))).filter((m) => !(cheatClearedAt && m.type === 'system' && new Date(m.created_date || 0).getTime() <= cheatClearedAt)).map((m) => (
            <div key={m.id} className={`flex w-full min-w-0 shrink-0 gap-2 group ${m.type === 'system' ? 'justify-center' : ''}`}>
              {m.type === 'system' ? (
                (() => {
                  const frame = parseFrameMetadata((m.text || '').replace(/\{\{PFRAME\|[^}]*\}\}/g, ''));
                  const { text: cleanText, color: roleColor, roleKey, hasRole } = parseRoleMetadata(frame.rest);
                  // Seviye atlama kartı: atış seviyesi "X 24 lvl atladı", hediye alma seviyesi
                  // "X 24 hediye lvl atladı" — ikisi farklı ikon ve renkle gösterilir.
                  const levelUp = parseLevelUpNotice(m.text || '');
                  if (levelUp || /odaya katıldı|odadan ayrıldı|kişisel odasını açtı/.test(m.text || '')) {
                    const profile = profiles[m.user_id] || viewerProfiles[m.user_id] || {};
                    return <RoomCheatNotice isOwner={m.user_id === ownerId} userId={m.user_id} onOpenProfile={onProfileCard} profile={{ ...profile, display_role: profile.display_role || roleKey }} notice={{ participant: { name: m.user_name, avatar: m.user_avatar }, level: levelUp ? levelUp.level : 0, levelKind: levelUp?.kind || '', type: levelUp ? 'levelup' : (m.text || '').includes('odadan ayrıldı') ? 'leave' : 'join' }} />;
                  }
                  const color = roleColor || frame.textColor || '#8b5cf6';
                  const isRole = hasRole || !!frame.frameId;
                  return (
                    <span
                      className={`min-w-0 max-w-full whitespace-pre-wrap [overflow-wrap:anywhere] text-xs px-3 py-1.5 rounded-full ${isRole ? 'font-bold neon-entrance' : 'text-[#A0A0A0] bg-[#1a1a1a]'}`}
                      style={isRole ? {
                        background: `linear-gradient(135deg, ${color}33, ${color}22)`,
                        color: color,
                        boxShadow: `0 0 10px -1px ${color}80`,
                        border: `1px solid ${color}55`,
                      } : {}}
                    >
                      {cleanText}
                    </span>
                  );
                })()
              ) : (
                <RoomChatMessage message={m} level={levels[m.user_id] || levels[hiddenUsersByName[m.user_name]] || 0} profile={profiles[m.user_id] || profiles[hiddenUsersByName[m.user_name]]} ownerId={ownerId} roomModerators={roomModerators} currentUserId={user?.id} canDelete={isOwner || user?.id === m.user_id} onDelete={del} onImage={setLightbox} onOpenProfile={onProfileCard} />
              )}
            </div>
          ))}
          </div>
          ) : msgFilter === 'izleyici' ? (
          <ParticipantHistoryPanel participants={participants} recentParticipants={recentParticipants} profiles={viewerProfiles} presenceMap={presenceMap} ownerId={ownerId} onSelect={onProfileCard} />
          ) : msgFilter === 'yetkililer' ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1 bg-black">
          {roomMods.length === 0 ? <p className="text-center text-sm text-[#A0A0A0] py-8">Henüz yetkili yok.</p> :
          roomMods.map((mod) => (
            <div key={mod.id || mod.user_id} className="flex items-center gap-2 py-1.5 px-1">
              <span className="w-8 h-8 rounded-full bg-[#8e44ad]/30 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-[#c39bd3]" />
              </span>
              <span className="flex-1 truncate text-sm text-white">{mod.user_name || mod.name || 'Kullanıcı'}</span>
              <span className="text-[10px] text-[#c39bd3] font-semibold">Mod</span>
            </div>
          ))}
          </div>
          ) : (
          <div className="dark flex-1 min-h-0 overflow-y-auto bg-black text-white" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
          <RoomSettingsContent {...(settingsProps || {})} />
          </div>
          )}
          {chatEnabled && msgFilter === 'all' && autoDeleteMinutes > 0 && countdownText && (
        <p className="flex items-center justify-center gap-1.5 border-t border-[#FFD700]/20 px-3 py-2 text-center text-[11px] font-semibold text-[#FFD700]">
          <Clock className="h-3 w-3" /> Otomatik silme: {autoDeleteMinutes} dk (kalan: {countdownText})
        </p>
      )}
      {chatEnabled && msgFilter === 'all' && showEmoji && (
        <EmojiPicker onSelect={(e) => { setText((t) => t + e); setShowEmoji(false); }} />
      )}
      {chatEnabled && msgFilter === 'all' && typingUsers.length > 0 && (
        <div className="px-3 py-1.5 border-t border-white/10 bg-black">
          <p className="text-xs text-purple-400 flex items-center gap-1.5">
            <span className="flex gap-0.5 items-end">
              <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <span className="truncate">{typingUsers.length === 1 ? `${typingUsers[0]} yazıyor...` : typingUsers.length === 2 ? `${typingUsers[0]} ve ${typingUsers[1]} yazıyor...` : `${typingUsers[0]} ve ${typingUsers.length - 1} kişi yazıyor...`}</span>
          </p>
        </div>
      )}
      {chatEnabled && msgFilter === 'all' && chatLocked && (
        <div className="p-2.5 border-t border-white/10 bg-black">
          <p className="rounded-full border border-primary/50 bg-black/60 px-4 py-2.5 text-center text-[11px] font-semibold text-primary">
            Sohbet yasağı var — yazmak için bir koltuğa otur.
          </p>
        </div>
      )}
      {chatEnabled && msgFilter === 'all' && !chatLocked && <div className="flex items-center gap-2 border-t border-[#FFD700]/25 bg-black p-2.5">
        <button type="button" onClick={() => setShowEmoji(!showEmoji)} title="Emoji" className={`h-10 w-10 shrink-0 text-[#00FF66] active:scale-95 ${neonCircleClass('green')}`}><Smile className="w-4 h-4" /></button>
        <div className="flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-full border border-white/15 bg-[#0d0d0d] px-3 focus-within:border-[#FFD700]/60">
          <MessageSquare className="h-4 w-4 shrink-0 text-[#A0A0A0]" />
          <input value={text} onChange={(e) => { setText(e.target.value); sendTyping(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }} inputMode="text" enterKeyHint="send" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false} placeholder="Mesaj yazın..." className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[#A0A0A0]" />
        </div>
        <button type="button" onClick={send} disabled={!text.trim() || uploading || sending} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#FFD700] bg-[#FFD700] text-black shadow-[0_0_22px_-2px_rgba(255,215,0,0.95)] active:scale-95 disabled:opacity-50"><Send className="w-5 h-5" /></button>
        {(uploading || sending) && <span className="shrink-0 animate-pulse text-xs text-[#A0A0A0]">...</span>}
      </div>}


      {lightbox && <div onClick={() => setLightbox(null)} className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4"><button className="absolute top-4 right-4 text-white p-2"><X className="w-6 h-6" /></button><Image src={lightbox} className="max-w-full max-h-full rounded-lg" fittingType="fit" /></div>}
    </div>
  );
}