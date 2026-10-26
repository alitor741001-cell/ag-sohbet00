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
  const chip = 'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary';
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {owner && <span className={chip}><Crown className="h-3 w-3" />AJANS SAHİBİ</span>}
        {pending && <span className={chip}>AJANS ONAY BEKLİYOR</span>}
        {profile.agency_role === 'assistant' && <span className={chip}><Handshake className="h-3 w-3" />ASİSTAN</span>}
        {broadcaster && <span className={chip}><Mic2 className="h-3 w-3" />YAYINCI</span>}
        {official.active && <OfficialBadge />}
        {isMine && <span className={chip}>YAYINCIM</span>}
      </div>
      {name && <div className="flex w-full min-w-0 items-start gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-left text-xs font-bold text-primary"><Building2 className="mt-0.5 h-4 w-4 shrink-0" /><div className="min-w-0 flex-1 whitespace-normal [overflow-wrap:anywhere]"><p>Ajans: {name}</p><p className="mt-1 text-[11px]">Ajans Kimliği: {code || '—'}</p></div></div>}
      {profile.agency_role === 'assistant' && owner && profile.agency_name && profile.agency_record_id !== profile.owned_agency_id && <p className="text-[10px] text-muted-foreground">Asistan olduğu ajans: {profile.agency_name}</p>}
    </div>
  );
}