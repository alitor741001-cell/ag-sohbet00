import { ScrollText, ShieldOff } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';

const formatTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/** Kayıt defteri: yönetici işlemleri (koltuktan indirme, odadan atma) ve odadan atılanlar listesi. */
export default function RoomLogSheet({ open, onClose, logs = [], bannedUsers = [], onUnban }) {
  return (
    <VoiceSheet open={open} onClose={onClose} title="Kayıt Defteri">
      <section className="rounded-2xl border border-white/10 bg-[#171720] p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">Odadan Atılanlar</p>
        {bannedUsers.length === 0 ? (
          <p className="text-xs text-white/50">Odadan atılmış kimse yok.</p>
        ) : (
          <div className="space-y-2">
            {bannedUsers.map((person) => (
              <div key={person.user_id} className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm text-white">{person.name || 'Kullanıcı'}</span>
                <button
                  type="button"
                  onClick={() => onUnban?.(person.user_id)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white active:scale-95 transition-transform"
                >
                  <ShieldOff className="h-3.5 w-3.5" /> Yasağı kaldır
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-[#171720] p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">İşlem Kayıtları</p>
        {logs.length === 0 ? (
          <p className="text-xs text-white/50">Henüz kayıt yok.</p>
        ) : (
          <div className="no-scrollbar max-h-[40vh] space-y-2 overflow-y-auto">
            {logs.map((entry, index) => (
              <div key={`${entry.created_at || 'log'}-${index}`} className="flex items-start gap-2 rounded-xl bg-black/30 px-3 py-2">
                <ScrollText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs leading-snug text-white/90">{entry.text}</p>
                  {entry.created_at && <p className="mt-0.5 text-[10px] text-white/40">{formatTime(entry.created_at)}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-3 pb-4 text-center text-[10px] leading-tight text-white/45">
        Koltuktan indirme ve odadan atma işlemleri sohbet paneline değil buraya kaydedilir.
      </p>
    </VoiceSheet>
  );
}