import { Building2, Crown, Handshake, Mic2 } from 'lucide-react';
import OfficialBadge from '@/components/profile/OfficialBadge';
import useAgOfficial from '@/hooks/useAgOfficial';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { broadcasterState } from '@/lib/broadcaster';

/** Tüm profil yüzeyleri aynı ajans ve görev etiketlerini kullanır. */
export default function ProfileAgencyBadges({ profile = {}, userId }) {
  const { user } = useCurrentUser();
  const official = useAgOfficial(userId || profile.id);
  const broadcaster = broadcasterState(profile).active;
  const myAgencyId = user?.owned_agency_id || user?.agency_record_id;
  const isMine = !!myAgencyId && profile.agency_record_id === myAgencyId && (userId || profile.id) !== user?.id;
  const owned = !!profile.owned_agency_id || profile.agency_role === 'owner';
  const pending = owned && profile.owned_agency_status === 'pending';
  const rejected = profile.owned_agency_status === 'rejected';
  const owner = owned && !pending && !rejected;
  const name = owner || pending ? profile.owned_agency_name || profile.agency_name : profile.agency_name;
  const code = owner || pending ? profile.owned_agency_code || profile.agency_code : profile.agency_code;
  if (!name && !owned && profile.agency_role !== 'assistant' && !official.active && !isMine && !broadcaster) return null;
  const assistant = profile.agency_role === 'assistant';
  // Her etiket kendi renginde: sahip altın, yayıncı pembe, asistan mavi, ajans mor.
  const base = 'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold';
  const TONES = {
    amber: 'border-amber-300/50 bg-amber-400/15 text-amber-200',
    pink: 'border-pink-300/50 bg-pink-500/15 text-pink-200',
    cyan: 'border-cyan-300/50 bg-cyan-500/15 text-cyan-200',
    emerald: 'border-emerald-300/50 bg-emerald-500/15 text-emerald-200',
    indigo: 'border-indigo-300/50 bg-indigo-500/15 text-indigo-200',
  };
  const chip = (tone) => `${base} ${TONES[tone]}`;
  const even = `${chip('cyan')} justify-center`;
  // Asistanı olan kişide "YAYINCIM" ve "ASİSTAN" aynı satırı eşit paylaşır.
  const pair = isMine && assistant;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {owner && <span className={chip('amber')}><Crown className="h-3 w-3" />AJANS SAHİBİ</span>}
        {pending && <span className={chip('amber')}>AJANS ONAY BEKLİYOR</span>}
        {broadcaster && <span className={chip('pink')}><Mic2 className="h-3 w-3" />YAYINCI</span>}
        {official.active && <OfficialBadge />}
        {isMine && !pair && <span className={chip('emerald')}>YAYINCIM</span>}
        {assistant && !pair && <span className={chip('cyan')}><Handshake className="h-3 w-3" />ASİSTAN</span>}
      </div>
      {pair && <div className="grid grid-cols-2 gap-1.5">
        <span className={even}>YAYINCIM</span>
        <span className={even}><Handshake className="h-3 w-3" />ASİSTAN</span>
      </div>}
      {name && <div className="flex w-full min-w-0 items-start gap-2 rounded-xl border border-indigo-300/40 bg-gradient-to-r from-indigo-500/20 to-violet-500/15 px-3 py-2 text-left text-xs font-bold text-indigo-100 shadow-[0_0_16px_-8px_rgba(129,140,248,0.9)]"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-200" /><div className="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]"><p>Ajans: {name}</p><p className="mt-1 text-[11px]">Ajans Kimliği: {code || '—'}</p></div></div>}
      {profile.agency_role === 'assistant' && owner && profile.agency_name && profile.agency_record_id !== profile.owned_agency_id && <p className="text-[10px] text-muted-foreground">Asistan olduğu ajans: {profile.agency_name}</p>}
    </div>
  );
}