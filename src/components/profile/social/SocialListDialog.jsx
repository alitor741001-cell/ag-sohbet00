import { useEffect, useState } from 'react';
import { useUserProfile } from '@/lib/profileCard';
import { ArrowLeft, Eye, HeartHandshake, Loader2, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

const TITLES = {
  following: { label: 'Takip Edilenler', Icon: UserCheck },
  followers: { label: 'Takipçiler', Icon: HeartHandshake },
  visitors: { label: 'Ziyaretçiler', Icon: Eye },
};

/** Takip ve ziyaretçi listeleri: tam ekran açılır, geri butonuyla profile dönülür. */
export default function SocialListDialog({ open, kind, onClose }) {
  const [items, setItems] = useState([]);
  const { openUserProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const meta = TITLES[kind] || TITLES.visitors;

  useEffect(() => {
    if (!open || !kind) return;
    let alive = true;
    setLoading(true);
    setItems([]);
    const payload = kind === 'visitors' ? { action: 'visitors' } : { action: 'list', kind };
    base44.functions.invoke('social-service', payload)
      .then((response) => { if (alive) setItems(response.data?.items || []); })
      .catch(() => { if (alive) setItems([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, kind]);

  if (!open) return null;

  return (
    <div
      className="dark fixed inset-0 z-[300] flex flex-col text-white"
      style={{ background: 'radial-gradient(120% 80% at 50% 0%, #3a1146 0%, #1b0a2a 46%, #0a0410 100%)' }}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-[#f2ce6b]/25 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => onClose?.()}
          aria-label="Geri"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/40 active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <p className="flex min-w-0 flex-1 items-center justify-center gap-2 text-sm font-extrabold text-[#f2ce6b]">
          <meta.Icon className="h-4 w-4 shrink-0" /> {meta.label}
        </p>
        <span className="h-9 w-9 shrink-0" />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#f2ce6b]" /></div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-sm font-semibold text-white/50">Henüz kimse yok.</p>
        ) : (
          <div className="mx-auto w-full max-w-[430px] space-y-1.5">
            {items.map((person) => (
              <button
                type="button"
                key={person.id}
                onClick={() => { onClose?.(); openUserProfile(person.id); }}
                className="flex w-full text-left items-center gap-3 rounded-xl border border-[#f2ce6b]/25 bg-white/[0.04] p-2.5 active:scale-[0.99]"
              >
                {person.avatar ? (
                  <Image src={person.avatar} className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#f2ce6b]/40" fittingType="fill" alt="" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2a1038] font-black text-[#f2ce6b]">
                    {(person.name || '?')[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{person.name}</span>
                  <span className="block text-[10.5px] font-semibold text-white/45">
                    {person.member_id ? `Üye No: ${person.member_id}` : 'Üye'}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}