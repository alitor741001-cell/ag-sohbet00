import { FileText } from 'lucide-react';
import NeonPanel from '@/components/profile/neon/NeonPanel';

/** Ajans şeridi: ajans adı ve ajans kimliği tek kutuda. */
export default function NeonAgencyBar({ user }) {
  const owned = !!user.owned_agency_id || user.agency_role === 'owner';
  const name = owned ? user.owned_agency_name || user.agency_name : user.agency_name;
  const code = owned ? user.owned_agency_code || user.agency_code : user.agency_code;
  if (!name && !code) return null;
  return (
    <NeonPanel className="dragon-agency" innerClassName="flex items-center gap-3 px-3.5 py-3">
      <FileText className="h-5 w-5 shrink-0 text-[#7dd3fc]" aria-hidden="true" />
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-white">Ajans: {name || '—'}</p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-[#9fd8ff]">Ajans Kimliği: {code || '—'}</p>
      </div>
    </NeonPanel>
  );
}