import { useEffect, useState } from 'react';
import { Armchair, Eraser, Eye, EyeOff, Film, Hash, Lock, MessageSquareOff, Music, Play, ScrollText, Shield, Square, Unlock, UserPlus } from 'lucide-react';
import BoardToggleRow from '@/components/voice/BoardToggleRow';
import SeatCountPicker from '@/components/voice/SeatCountPicker';
import VoiceMenuTile from '@/components/voice/VoiceMenuTile';
import VoiceSheet from '@/components/voice/VoiceSheet';
import { Image } from '@/components/ui/image';

const Panel = ({ children, hint }) => (
  <div className="mt-4 rounded-2xl border border-[#FFD700]/45 bg-black/70 p-3 shadow-[0_0_18px_-8px_rgba(255,215,0,0.9)]">
    {children}
    {hint && <p className="mt-2 text-[11px] text-white/45">{hint}</p>}
  </div>
);

/** "…" menüsü: yuvarlak ikon ızgarası — kilit, gizlilik, koltuk, sayaç, sohbet temizleme, sohbet yasağı ve kayıt defteri. */
export default function VoiceRoomMenu({ open, onClose, room, userId, participants = [], isOwner, isAdmin, canMod, onSeatCount, onSetPassword, onToggleHidden, onToggleMod, onInvite, boardActive, onToggleBoard, onBoardSettings, onClearChat, onToggleChatBan, onOpenLog, onExitVoiceMode, musicPlaying, onOpenMusic }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [panel, setPanel] = useState(null);
  const locked = !!room?.password;
  const chatBanned = room?.chat_seated_only === true;
  // Sayaç sıfırlama seçenekleri: koltuktan inme ve odadan çıkma durumları.
  const seatReset = room?.number_board_reset_seat !== false;
  const roomReset = room?.number_board_reset_room !== false;
  const moderators = room?.room_moderators || [];
  const others = participants.filter((item) => item.user_id !== room?.owner_id);

  useEffect(() => {
    if (open) return;
    setPanel(null);
    setPassword('');
    setShowPassword(false);
  }, [open]);

  const toggle = (name) => setPanel((current) => (current === name ? null : name));

  // Yöneticiye verilen yetkiler: yalnızca koltuklar, sayaç, sohbet temizleme ve sohbet yasağı.
  const MOD_TILES = ['seats', 'board', 'clear', 'ban'];

  // Sohbeti temizle ve sohbet yasağı tek dokunuşla çalışır — ayrı panel açmaz.
  const manageTiles = [
    {
      key: 'lock',
      icon: locked ? Unlock : Lock,
      label: locked ? 'Kilidi aç' : 'Kilit',
      active: locked,
      tone: 'gold',
      onClick: () => { if (locked) { onSetPassword(''); setPanel(null); } else { toggle('lock'); } },
    },
    { key: 'hidden', icon: room?.hidden ? EyeOff : Eye, label: 'Gizli', active: !!room?.hidden, tone: 'purple', onClick: onToggleHidden },
    { key: 'seats', icon: Armchair, label: 'Koltuk', active: panel === 'seats', tone: 'blue', onClick: () => toggle('seats') },
    // Sayaç düğmesi ayarları açar; tekrar basınca kapanır.
    { key: 'board', icon: Hash, label: 'Sayaç', active: !!boardActive || panel === 'board', tone: 'green', onClick: () => toggle('board') },
    { key: 'clear', icon: Eraser, label: 'Sohbeti temizle', tone: 'red', onClick: () => { onClose(); onClearChat?.(); } },
    {
      key: 'ban',
      icon: MessageSquareOff,
      label: chatBanned ? 'Sohbet yasağını kaldır' : 'Sohbet yasağı etkinleştir',
      active: chatBanned,
      tone: 'red',
      onClick: onToggleChatBan,
    },
    { key: 'log', icon: ScrollText, label: 'Kayıt defteri', tone: 'white', onClick: () => { onClose(); onOpenLog?.(); } },
  ];

  // Oda sahibi ve admin hesaplar tüm ayarları görür; diğer yönetici rolü dört yetkiyle sınırlıdır.
  const fullAccess = isOwner || isAdmin;
  const tiles = fullAccess ? manageTiles : manageTiles.filter((item) => MOD_TILES.includes(item.key));

  return (
    <VoiceSheet open={open} onClose={onClose} title="Oda ayarları">
      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {/* Davet herkes için açık: oda sahibi, yöneticiler ve izleyiciler arkadaşını davet edebilir. */}
        {onInvite && (
          <VoiceMenuTile
            icon={UserPlus}
            label="Davet et"
            tone="green"
            onClick={() => { onClose(); onInvite(); }}
          />
        )}
        {/* Müzik: herkes kendi listesinden şarkı açar, oda aynı şarkıyı duyar. */}
        {onOpenMusic && (
          <VoiceMenuTile
            icon={Music}
            label="Müzik"
            active={!!musicPlaying}
            tone="gold"
            onClick={() => { onClose(); onOpenMusic(); }}
          />
        )}
        {/* Oda sahibi ve yöneticiler sesli odayı istedikleri an film odasına çevirebilir. */}
        {canMod && onExitVoiceMode && (
          <VoiceMenuTile icon={Film} label="Film Odasına Geçir" tone="gold" onClick={() => { onClose(); onExitVoiceMode(); }} />
        )}
        {canMod && tiles.map((item) => (
          <VoiceMenuTile
            key={item.key}
            icon={item.icon}
            label={item.label}
            active={!!item.active}
            tone={item.tone}
            onClick={item.onClick}
          />
        ))}
      </div>

      {!canMod && <p className="mt-4 rounded-xl border border-[#FFD700]/30 bg-black/70 p-3 text-xs text-white/60">Oda ayarlarını yalnızca oda sahibi ve yöneticiler değiştirebilir.</p>}

      {canMod && panel === 'seats' && (
        <Panel hint={`Şu an ${room?.seat_count || 0} koltuk açık. Sığmayanlar izleyiciye düşer.`}>
          <SeatCountPicker compact value={room?.seat_count} onChange={onSeatCount} />
        </Panel>
      )}

      {canMod && panel === 'lock' && (
        <Panel hint="Şifre belirleyerek odayı kilitleyebilirsin. Girmek için şifre istenir.">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? 'text' : 'password'}
                placeholder="Oda şifresi"
                className="h-10 w-full rounded-xl bg-white/10 px-3 pr-9 text-sm text-white outline-none placeholder:text-white/40"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="button" disabled={!password.trim()} onClick={() => { onSetPassword(password.trim()); setPassword(''); setPanel(null); }} className="flex h-10 items-center gap-1.5 rounded-full border border-[#FFD700] bg-[#FFD700] px-4 text-sm font-bold text-black shadow-[0_0_14px_-3px_rgba(255,215,0,0.95)] disabled:opacity-40">
              <Lock className="h-4 w-4" /> Şifrele
            </button>
          </div>
        </Panel>
      )}

      {canMod && panel === 'board' && (
        <Panel hint="Başlat'a bastığında koltukların altında “Devam Ediyor” sayacı 1'den başlar ve her saniye ilerler.">
          <div className="space-y-2">
            <BoardToggleRow
              label="Koltuktan inince sıfırla"
              value={seatReset}
              onToggle={() => onBoardSettings?.(!seatReset, roomReset)}
            />
            <BoardToggleRow
              label="Odadan çıkınca sıfırla"
              value={roomReset}
              onToggle={() => onBoardSettings?.(seatReset, !roomReset)}
            />
          </div>
          <button
            type="button"
            onClick={onToggleBoard}
            className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold ${boardActive ? 'bg-primary text-primary-foreground' : 'bg-emerald-500 text-black'}`}
          >
            {boardActive ? <><Square className="h-4 w-4" /> Durdur</> : <><Play className="h-4 w-4" /> Başlat</>}
          </button>
        </Panel>
      )}

      {canMod && (
        <p className="mt-3 rounded-xl border border-[#FFD700]/30 bg-black/70 px-3 py-2 text-[11px] font-semibold text-white/60">
          Sohbeti temizle ve sohbet yasağı tek dokunuşla uygulanır.
        </p>
      )}

      {chatBanned && (
        <p className="mt-3 rounded-xl bg-primary/15 px-3 py-2 text-[11px] font-semibold text-primary">
          Sohbet yasağı açık — yalnızca koltuktakiler yazabilir.
        </p>
      )}

      {fullAccess && (
        <section className="mt-4 rounded-2xl border border-[#FFD700]/45 bg-black/70 p-3 shadow-[0_0_18px_-8px_rgba(255,215,0,0.9)]">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#FFD700]">Yöneticiler</p>
          {others.length === 0 ? (
            <p className="text-xs text-white/50">Odada başka kişi yok.</p>
          ) : (
            <div className="space-y-2">
              {others.map((person) => {
                const isMod = moderators.includes(person.user_id);
                return (
                  <div key={person.user_id} className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2">
                    {/* Kişinin profil fotoğrafı ve ismi birlikte görünür. */}
                    {person.avatar ? (
                      <Image src={person.avatar} alt={person.name || 'Profil'} className="h-9 w-9 shrink-0 overflow-hidden rounded-full" fittingType="fill" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD700]/20 text-sm font-black text-[#FFD700]">
                        {String(person.name || 'K').trim().charAt(0).toLocaleUpperCase('tr-TR')}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{person.name || 'Kullanıcı'}{person.user_id === userId && ' (Sen)'}</span>
                    <button
                      type="button"
                      onClick={() => onToggleMod(person.user_id, !isMod)}
                      disabled={!fullAccess && !isMod}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40 ${isMod ? 'bg-sky-500/20 text-sky-300' : 'bg-white/10 text-white'}`}
                    >
                      <Shield className="h-3.5 w-3.5" /> {isMod ? 'Yetkiyi al' : 'Yönetici yap'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </VoiceSheet>
  );
}