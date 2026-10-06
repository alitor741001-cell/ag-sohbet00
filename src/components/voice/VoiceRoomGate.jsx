import { Loader2, Lock, ShieldAlert } from 'lucide-react';
import RoomOwnerBadge from '@/components/player/RoomOwnerBadge';

/**
 * Sesli odaya giriş öncesi ekranlar: yükleme, giriş yasağı, bilgi mesajı, şifre sorma
 * ve bağlanma beklemesi. Odaya girildiğinde hiçbiri gösterilmez.
 */
export default function VoiceRoomGate({
  loading,
  banNotice,
  notice,
  needsPassword,
  room,
  password,
  onPasswordChange,
  onSubmitPassword,
  onGoHome,
}) {
  if (loading) {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-catalog">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Odadan atıldıysanız: 24 saatlik giriş yasağı ekranda açıkça gösterilir.
  if (banNotice) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-3 bg-catalog px-6 text-center text-white">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <p className="text-base font-bold">Odaya giremezsiniz</p>
        <p className="max-w-xs text-sm text-white/70">{banNotice}</p>
        <button type="button" onClick={onGoHome} className="mt-1 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold">
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  if (notice && !needsPassword) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-4 bg-catalog px-6 text-center text-white">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <p className="max-w-xs text-sm text-white/70">{notice}</p>
        <button type="button" onClick={onGoHome} className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold">
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-4 bg-catalog px-6 text-white">
        <Lock className="h-10 w-10 text-amber-400" />
        <RoomOwnerBadge ownerId={room?.owner_id} fallbackName={room?.owner_name} />
        <p className="text-sm text-white/70">{room?.name || 'Oda'} kilitli. Şifreyi gir.</p>
        <form
          onSubmit={(event) => { event.preventDefault(); onSubmitPassword(password); }}
          className="w-full max-w-xs space-y-3"
        >
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Oda şifresi"
            className="h-11 w-full rounded-xl bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/40"
          />
          {notice && <p className="text-center text-xs text-red-400">{notice}</p>}
          <button type="submit" className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground">Odaya gir</button>
        </form>
        <button type="button" onClick={onGoHome} className="text-xs text-white/50">Vazgeç</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center gap-3 bg-catalog text-white">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-xs text-white/60">Odaya bağlanılıyor...</p>
    </div>
  );
}