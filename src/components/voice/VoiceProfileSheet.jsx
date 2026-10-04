import { Fragment, useEffect, useState } from 'react';
import { Copy, Info, MicOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';

/**
 * Koyu-altın kullanıcı profili: koltuktaki kişinin profiline dokununca açılır.
 * Gizli kullanıcıda kimlik çekilmez — yalnızca maskeli profil ve eylemler görünür.
 */
export default function VoiceProfileSheet({ open, onClose, userId, name, avatar, hidden, muted, tiles = [], footer = [] }) {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!open || !userId) { setProfile(null); return; }
    setProfile(null);
    base44.functions.invoke('user-profile', { user_id: userId })
      .then((response) => setProfile(response?.data || {}))
      .catch(() => setProfile({}));
  }, [open, userId]);

  if (!open) return null;

  const shownName = hidden ? (name || 'Gizli Kullanıcı') : (profile?.username || profile?.full_name || name || 'Kullanıcı');
  const shownAvatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || avatar || '');
  const memberId = !hidden && profile?.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const roleLabel = hidden ? '' : (profile?.title || profile?.display_role || '');

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(memberId);
      toast({ title: 'Kimlik kopyalandı', description: `#${memberId}` });
    } catch {
      toast({ title: 'Kopyalanamadı', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="relative w-full max-w-[330px] rounded-3xl bg-gradient-to-b from-[#2B2533] to-[#1F1B25] px-4 pb-4 pt-12 shadow-2xl ring-1 ring-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Üstten taşan profil görseli */}
        <span className="absolute -top-9 left-1/2 flex h-[76px] w-[76px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-[3px] border-[#E2D1B2]/80 bg-black/50 shadow-xl">
          {shownAvatar
            ? <img src={shownAvatar} alt={shownName} referrerPolicy="no-referrer" draggable={false} className="h-full w-full object-cover object-center" />
            : <span className="text-2xl font-bold text-[#E2D1B2]">{(shownName || '?').trim().charAt(0)}</span>}
        </span>

        {/* Sağ üst durum simgeleri */}
        <div className="absolute right-3 top-3 flex items-center gap-2 text-[#8E7D62]">
          {muted && <MicOff className="h-4 w-4" />}
          {hidden && <Info className="h-4 w-4" />}
        </div>

        <div className="text-center">
          <p className="truncate text-[15px] font-bold text-[#E2D1B2]">{shownName}</p>
          {hidden ? (
            <p className="mt-1 text-[11px] leading-snug text-[#8E7D62]">
              Kullanıcı, özel Gizli Kullanıcı modunu etkinleştirdi. Kimlik bilgileri gizli kalır.
            </p>
          ) : (
            <div className="mt-1 flex items-center justify-center gap-1.5">
              {roleLabel && <span className="text-[11px] font-semibold text-[#8E7D62]">{roleLabel}</span>}
              {memberId && (
                <button
                  type="button"
                  onClick={copyId}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-[#8E7D62] transition-transform active:scale-95"
                >
                  <span className="font-mono">#{memberId}</span>
                  <Copy className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {tiles.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-x-1 gap-y-3">
            {tiles.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={item.disabled}
                onClick={item.onClick}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1.5 text-[11px] font-semibold text-[#E2D1B2] transition-transform active:scale-95 disabled:opacity-35"
              >
                <item.icon className="h-6 w-6" strokeWidth={1.75} />
                <span className="max-w-full text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {footer.length > 0 && (
          <div className="mt-3 flex items-center justify-center border-t border-white/10 pt-3">
            {footer.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 && <span className="mx-3 h-4 w-px bg-white/15" />}
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 ${item.danger ? 'text-[#E57373]' : 'text-[#E2D1B2]'}`}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </button>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}