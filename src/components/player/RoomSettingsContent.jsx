import { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, MessageCircle, MessageSquare, MessageSquareOff, Mic, Share2, Unlock, UserX, Film, Shield, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { neonCardClass } from '@/lib/neonStyle';

export default function RoomSettingsContent({ room, canMod, participants, roomModerators, onAssignMod, onRemoveMod, roomName, setRoomName, onSaveName, password, setPassword, passwordOpen, setPasswordOpen, onVoice, onChat, onHidden, onPassword, onRemovePassword, onUnban, onPickMovie, onDeleteRoom, onShare, onChatBan }) {
  const { toast } = useToast();
  const [showBanned, setShowBanned] = useState(false);
  const [showMods, setShowMods] = useState(false);
  const [savedMods, setSavedMods] = useState([]);
  useEffect(() => { if (!room?.owner_id) return; base44.entities.RoomMod.filter({ owner_id: room.owner_id }, 'created_date', 100).then(setSavedMods).catch(() => {}); }, [room?.owner_id]);
  // Ayarlar kartları: siyah zemin + parlayan altın çerçeve.
  const button = `w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-white transition-colors hover:border-[#FFD700]/80 ${neonCardClass('gold')}`;
  const shareText = `🎬🍿 Canlı odaya katıl: ${window.location.href}`;
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  // Paylaş: arkadaş listesinden tek tek seçim yapılır (sesli odadaki paylaşımla aynı akış).
  const bannedUsers = room.banned_users || [];
  // Sesli sohbet alanı açıkken buton film odasına dönüş yapar.
  const voiceMode = room?.voice_mode === true;

  const handleUnban = async (userId, name) => {
    try { await onUnban(userId); toast({ title: `${name} için yasak kaldırıldı` }); }
    catch (e) { toast({ title: 'İşlem başarısız', variant: 'destructive' }); }
  };

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}>
      {!canMod ? <p className="text-sm text-white/60">Bu ayarları yalnızca oda sahibi değiştirebilir.</p> : <div className="space-y-2">
        <div className="flex gap-2">
          <input value={roomName || ''} onChange={(e) => setRoomName(e.target.value)} placeholder="Oda adı" className="min-w-0 flex-1 rounded-full border border-white/15 bg-[#0d0d0d] px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#FFD700]/60" maxLength={80} />
          <button onClick={onSaveName} disabled={!roomName?.trim()} className="shrink-0 min-h-11 rounded-full border border-[#FFD700] bg-[#FFD700] px-4 text-xs font-bold text-black shadow-[0_0_14px_-3px_rgba(255,215,0,0.95)] disabled:opacity-50">KAYDET</button>
        </div>
        <button onClick={onPickMovie} className={button}><Film className="w-4 h-4 text-primary" /> Yayını Seç</button>
        <button onClick={onVoice} aria-pressed={voiceMode} className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${voiceMode ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
          {voiceMode ? <Film className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          <span className="flex-1 text-left">{voiceMode ? 'Film Odasına Dön' : 'Sesli Sohbet Alanı'}</span>
          <span className={`w-10 h-5 rounded-full relative overflow-hidden transition-colors shrink-0 ${voiceMode ? 'bg-green-500' : 'bg-red-500'}`}><span className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white transition-transform ${voiceMode ? 'translate-x-5' : 'translate-x-0.5'}`} /></span>
        </button>
        <button onClick={onChat} aria-pressed={room.chat_enabled} className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${room.chat_enabled ? 'border-green-500/40 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-400'}`}>
          {room.chat_enabled ? <MessageSquare className="w-4 h-4" /> : <MessageSquareOff className="w-4 h-4" />}
          <span className="flex-1 text-left">{room.chat_enabled ? 'Sohbet: Açık' : 'Sohbet: Kapalı'}</span>
          <span className={`w-10 h-5 rounded-full relative overflow-hidden transition-colors shrink-0 ${room.chat_enabled ? 'bg-green-500' : 'bg-red-500'}`}><span className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white transition-transform ${room.chat_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} /></span>
        </button>
        {onChatBan && (
          <button onClick={onChatBan} aria-pressed={room.chat_seated_only} className={`w-full flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${room.chat_seated_only ? 'border-amber-500/40 bg-amber-500/10 text-amber-400' : 'border-green-500/40 bg-green-500/10 text-green-400'}`}>
            <MessageSquareOff className="w-4 h-4" />
            <span className="flex-1 text-left">{room.chat_seated_only ? 'Sohbet Yasağı: Açık' : 'Sohbet Yasağı: Kapalı'}</span>
            <span className={`w-10 h-5 rounded-full relative overflow-hidden transition-colors shrink-0 ${room.chat_seated_only ? 'bg-amber-500' : 'bg-green-500'}`}><span className={`absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white transition-transform ${room.chat_seated_only ? 'translate-x-5' : 'translate-x-0.5'}`} /></span>
          </button>
        )}
        {/* Yönetici kısayolları: odayı kilitle (şifre) ve ana sayfa listesinden gizle. */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onHidden} aria-pressed={room.hidden} className={button}>{room.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} {room.hidden ? 'Gizli' : 'Gizle'}</button>
          <button onClick={() => room.password ? onRemovePassword() : setPasswordOpen(!passwordOpen)} className={button}>{room.password ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />} {room.password ? 'Kilidi Aç' : 'Kilitle'}</button>
        </div>
        {passwordOpen && !room.password && <div className="flex gap-2"><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Oda şifresi" className="min-w-0 flex-1 rounded-full border border-white/15 bg-[#0d0d0d] px-4 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#FFD700]/60" /><button onClick={onPassword} disabled={!password.trim()} className="shrink-0 min-h-11 rounded-full border border-[#FFD700] bg-[#FFD700] px-4 text-xs font-bold text-black shadow-[0_0_14px_-3px_rgba(255,215,0,0.95)] disabled:opacity-50">KAYDET</button></div>}
        <button onClick={() => setShowBanned(!showBanned)} className={button}><UserX className="w-4 h-4 text-red-400" /> Atılan Kullanıcılar ({bannedUsers.length})</button>
        {canMod && ((participants && participants.length > 1) || savedMods.length > 0) && (
          <>
            <button onClick={() => setShowMods(!showMods)} className={button}><Shield className="w-4 h-4 text-blue-400" /> Moderatörler ({roomModerators.length})</button>
            {showMods && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[#FFD700]/35 bg-black/60 p-2">
                {savedMods.filter((m) => !participants.some((p) => p.user_id === m.user_id)).map((m) => (
                  <div key={m.user_id} className="flex items-center justify-between gap-2">
                    <span className="text-xs truncate flex-1">{m.user_name} <span className="text-muted-foreground">(çevrim dışı)</span></span>
                    <button onClick={() => onRemoveMod(m.user_id)} className="text-[10px] min-h-11 px-3 rounded-lg font-bold shrink-0 bg-red-500/20 text-red-400 hover:bg-red-500/30">Mod Kaldır</button>
                  </div>
                ))}
                {participants.filter((p) => p.user_id !== room.owner_id).map((p) => {
                  const isMod = roomModerators.includes(p.user_id);
                  return (
                    <div key={p.user_id} className="flex items-center justify-between gap-2">
                      <span className="text-xs truncate flex-1">{p.name}</span>
                      <button onClick={() => isMod ? onRemoveMod(p.user_id) : onAssignMod(p.user_id)} className={`text-[10px] min-h-11 px-3 rounded-lg font-bold shrink-0 ${isMod ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}>{isMod ? 'Mod Kaldır' : 'Mod Yap'}</button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {showBanned && (
          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-[#FFD700]/35 bg-black/60 p-2">
            {bannedUsers.length === 0 ? <p className="py-2 text-center text-xs text-white/50">Atılmış kullanıcı yok.</p> :
              bannedUsers.map((b) => (
                <div key={b.user_id} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate flex-1">{b.name || 'Kullanıcı'}</span>
                  <button onClick={() => handleUnban(b.user_id, b.name)} className="text-[10px] min-h-11 bg-green-500/20 text-green-400 px-3 rounded-lg font-bold hover:bg-green-500/30 shrink-0">Yasağı Kaldır</button>
                </div>
              ))
            }
          </div>
        )}
      </div>}
      </div>
      {room.is_personal && canMod && onDeleteRoom && (
        <button onClick={onDeleteRoom} className="mx-3 mb-2 flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#FF0033]/55 bg-black/70 px-3 py-2.5 text-sm font-semibold text-[#FF8A8A] shadow-[0_0_18px_-8px_rgba(255,0,51,0.9)] transition-colors hover:border-[#FF0033]">
          <Trash2 className="w-4 h-4" /> Odayı Sil
        </button>
      )}
      <div className="grid grid-cols-2 gap-2 border-t border-[#FFD700]/25 p-3"><button onClick={shareWhatsApp} className={button}><MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp</button><button onClick={onShare} className={button}><Share2 className="w-4 h-4 text-pink-500" /> Paylaş</button></div>
    </>
  );
}