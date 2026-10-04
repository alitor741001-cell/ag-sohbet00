import { Fragment, useEffect, useState } from 'react';
import { Copy, Info, MicOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { HIDDEN_AVATAR_URL } from '@/lib/hiddenUser';

/**
 * Kullanıcı profili: koltuktaki kişiye (kendi koltuğun dahil) dokununca açılır.
 * Gizli kullanıcıda kimlik çekilmez — maskeli profil ve aynı eylemler görünür.
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
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4 backdrop-blur-[2px]" onClick={onClose}>
      {/* Profil fotoğrafı kartın içinde tam görünür; bölümler ince çizgilerle ayrılır. */}
      <div
        className="relative max-h-[86vh] w-full max-w-[340px] overflow-y-auto rounded-[26px] bg-gradient-to-b from-[#2E2622] to-[#1D1815] shadow-[0_20px_55px_-14px_rgba(0,0,0,0.9)] ring-1 ring-[#D9C496]/30 sm:max-w-[390px] lg:max-w-[430px]"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#E5484D]/20 to-transparent" />

        <div className="absolute right-3 top-3 flex items-center gap-2 text-[#C6A45F]">
          {muted && <MicOff className="h-4 w-4" />}
          {hidden && <Info className="h-4 w-4" />}
        </div>

        <div className="relative px-5 pb-4 pt-5 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#D9C496]/70 bg-black/50 shadow-[0_0_18px_rgba(229,72,77,0.35)]">
            {shownAvatar
              ? <img src={shownAvatar} alt={shownName} referrerPolicy="no-referrer" draggable={false} className="h-full w-full object-cover object-center" />
              : <span className="text-3xl font-bold text-[#F2CE6B]">{(shownName || '?').trim().charAt(0)}</span>}
          </span>

          <p className="mt-2.5 truncate text-lg font-bold text-[#F2CE6B]">{shownName}</p>
          {roleLabel && <p className="mt-0.5 text-[11px] font-semibold text-[#C6A45F]">{roleLabel}</p>}

          {hidden ? (
            <p className="mt-1.5 text-[11px] leading-snug text-[#C6A45F]">
              Kullanıcı, özel Gizli Kullanıcı modunu etkinleştirdi. Kimlik bilgileri gizli kalır.
            </p>
          ) : memberId ? (
            <button
              type="button"
              onClick={copyId}
              className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#D9C496] transition-transform active:scale-95"
            >
              <span className="font-mono">#{memberId}</span>
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        {tiles.length > 0 && (
          <div className="grid grid-cols-3 gap-x-1 gap-y-3 border-t border-[#4D443D] px-3 py-4">
            {tiles.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={item.disabled}
                onClick={item.onClick}
                className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-1 text-[11px] font-semibold text-[#D9C496] transition-transform active:scale-95 disabled:opacity-35"
              >
                <item.icon className="h-6 w-6" strokeWidth={1.75} />
                <span className="max-w-full text-center leading-tight">{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {footer.length > 0 && (
          <div className="flex items-center justify-center border-t border-[#4D443D] px-3 py-3.5">
            {footer.map((item, index) => (
              <Fragment key={item.key}>
                {index > 0 && <span className="mx-5 h-5 w-px bg-[#4D443D]" />}
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`flex items-center gap-1.5 text-sm font-bold transition-transform active:scale-95 ${item.danger ? 'text-[#D66868]' : 'text-[#F2CE6B]'}`}
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