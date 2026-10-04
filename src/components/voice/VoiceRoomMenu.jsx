import { useState } from 'react';
import { Eye, EyeOff, Lock, Shield, Unlock, UserPlus } from 'lucide-react';
import SeatCountPicker from '@/components/voice/SeatCountPicker';
import VoiceSheet from '@/components/voice/VoiceSheet';

const Section = ({ title, children, hint }) => (
  <section className="mb-4 rounded-2xl border border-white/10 bg-[#171720] p-3">
    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">{title}</p>
    {children}
    {hint && <p className="mt-2 text-[11px] text-white/45">{hint}</p>}
  </section>
);

/** "…" menüsü: koltuk sayısı, oda kilidi (şifre), oda gizliliği ve yöneticilik. */
export default function VoiceRoomMenu({ open, onClose, room, userId, participants = [], isOwner, canMod, onSeatCount, onSetPassword, onToggleHidden, onToggleMod, onInvite, boardActive, onToggleBoard }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const locked = !!room?.password;
  const moderators = room?.room_moderators || [];
  const others = participants.filter((item) => item.user_id !== room?.owner_id);

  return (
    <VoiceSheet open={open} onClose={onClose} title="Oda ayarları">
      {onInvite && (
        <button
          type="button"
          onClick={() => { onClose(); onInvite(); }}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-bold text-white active:scale-95 transition-transform"
        >
          <UserPlus className="h-4 w-4" /> Arkadaşlarını davet et
        </button>
      )}

      {!canMod && <p className="mb-3 rounded-xl bg-white/5 p-3 text-xs text-white/60">Oda ayarlarını yalnızca oda sahibi ve yöneticiler değiştirebilir.</p>}

      {canMod && (
        <Section title="Koltuk sayısı" hint={`Şu an ${room?.seat_count || 0} koltuk açık. Dolu koltuklar korunur.`}>
          <SeatCountPicker compact value={room?.seat_count} onChange={onSeatCount} />
        </Section>
      )}

      {canMod && (
        <Section
          title="Sayı tahtası"
          hint={boardActive
            ? 'Her koltuğun altındaki sayaç 1’den başlar, hediye geldikçe artar. Kapatınca sayaçlar sıfırlanır.'
            : 'Açtığında tüm sayaçlar 1’den başlar; hediye geldikçe ileri sayar.'}
        >
          <button
            type="button"
            onClick={onToggleBoard}
            className={`w-full rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform ${boardActive ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'}`}
          >
            {boardActive ? 'Sayı tahtasını kapat' : 'Sayı tahtasını aç'}
          </button>
        </Section>
      )}

      {canMod && (
        <Section title="Oda kilidi" hint={locked ? 'Odaya girmek için şifre gerekiyor.' : 'Şifre belirleyerek odayı kilitleyebilirsin.'}>
          {locked ? (
            <button type="button" onClick={() => { setPassword(''); onSetPassword(''); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/20 py-2.5 text-sm font-bold text-amber-300 active:scale-95 transition-transform">
              <Unlock className="h-4 w-4" /> Kilidi kaldır
            </button>
          ) : (
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
              <button type="button" disabled={!password.trim()} onClick={() => { onSetPassword(password.trim()); setPassword(''); }} className="flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40">
                <Lock className="h-4 w-4" /> Şifrele
              </button>
            </div>
          )}
        </Section>
      )}

      {canMod && (
        <Section title="Oda gizliliği" hint={room?.hidden ? 'Oda listede görünmüyor, yalnızca davetliler girebilir.' : 'Oda açık odalar listesinde görünür.'}>
          <button type="button" onClick={onToggleHidden} className={`w-full rounded-xl py-2.5 text-sm font-bold active:scale-95 transition-transform ${room?.hidden ? 'bg-primary text-primary-foreground' : 'bg-white/10 text-white'}`}>
            {room?.hidden ? 'Gizli odayı herkese aç' : 'Odayı gizle'}
          </button>
        </Section>
      )}

      {canMod && (
        <Section title="Yöneticiler" hint="Yöneticiler koltukları kilitleyebilir, sesleri kapatabilir ve kişileri odadan atabilir.">
          {others.length === 0 ? (
            <p className="text-xs text-white/50">Odada başka kişi yok.</p>
          ) : (
            <div className="space-y-2">
              {others.map((person) => {
                const isMod = moderators.includes(person.user_id);
                return (
                  <div key={person.user_id} className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-white">{person.name || 'Kullanıcı'}{person.user_id === userId && ' (Sen)'}</span>
                    <button
                      type="button"
                      onClick={() => onToggleMod(person.user_id, !isMod)}
                      disabled={!isOwner && !isMod}
                      className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold disabled:opacity-40 ${isMod ? 'bg-sky-500/20 text-sky-300' : 'bg-white/10 text-white'}`}
                    >
                      <Shield className="h-3.5 w-3.5" /> {isMod ? 'Yetkiyi al' : 'Yönetici yap'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      )}
    </VoiceSheet>
  );
}