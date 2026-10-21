import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, HeartHandshake, Loader2, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Image } from '@/components/ui/image';

const TITLES = {
  following: { label: 'Takip Edilenler', Icon: UserCheck },
  followers: { label: 'Takipçiler', Icon: HeartHandshake },
  visitors: { label: 'Ziyaretçiler', Icon: Eye },
};

/** Takip ve ziyaretçi listeleri: satıra dokununca kişinin profili açılır. */
export default function SocialListDialog({ open, kind, onClose }) {
  const [items, setItems] = useState([]);
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

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose?.()}>
      <DialogContent className="max-w-md border-[#7dd3fc]/30 bg-[linear-gradient(180deg,#0B2A52,#05122A)] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#a5e4ff]">
            <meta.Icon className="h-4 w-4" /> {meta.label}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#6fe6dc]" /></div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm font-semibold text-white/50">Henüz kimse yok.</p>
        ) : (
          <div className="max-h-[60vh] space-y-1.5 overflow-y-auto">
            {items.map((person) => (
              <Link
                key={person.id}
                to={`/kullanici/${person.id}`}
                onClick={() => onClose?.()}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#08203f]/70 p-2.5 active:scale-[0.99]"
              >
                {person.avatar ? (
                  <Image src={person.avatar} className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#6fe6dc]/40" fittingType="fill" alt="" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#12395f] font-black text-[#a5e4ff]">
                    {(person.name || '?')[0]}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{person.name}</span>
                  <span className="block text-[10.5px] font-semibold text-white/45">
                    {person.member_id ? `Üye No: ${person.member_id}` : 'Üye'}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}