import { Building2, Crown, Handshake, Mic2 } from 'lucide-react';

/** Tüm profil yüzeyleri aynı ajans ve görev etiketlerini kullanır. */
export default function ProfileAgencyBadges({ profile = {} }) {
  const owned = !!profile.owned_agency_id || profile.agency_role === 'owner';
  const pending = owned && profile.owned_agency_status === 'pending';
  const rejected = profile.owned_agency_status === 'rejected';
  const owner = owned && !pending && !rejected;
  const name = owner || pending ? profile.owned_agency_name || profile.agency_name : profile.agency_name;
  const code = owner || pending ? profile.owned_agency_code || profile.agency_code : profile.agency_code;
  if (!name && !owned && profile.agency_role !== 'assistant') return null;
  const chip = 'inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-[10px] font-bold text-primary';
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {owner && <span className={chip}><Crown className="h-3 w-3" />AJANS SAHİBİ</span>}
        {pending && <span className={chip}>AJANS ONAY BEKLİYOR</span>}
        {profile.agency_role === 'assistant' && <span className={chip}><Handshake className="h-3 w-3" />ASİSTAN</span>}
        {profile.broadcaster_status === 'active' && <span className={chip}><Mic2 className="h-3 w-3" />YAYINCI</span>}
      </div>
      {name && <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /><span className="break-words">{name}{code ? ` · ${code}` : ''}</span></p>}
      {profile.agency_role === 'assistant' && owner && profile.agency_name && profile.agency_record_id !== profile.owned_agency_id && <p className="text-[10px] text-muted-foreground">Asistan olduğu ajans: {profile.agency_name}</p>}
    </div>
  );
}