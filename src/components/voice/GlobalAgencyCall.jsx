import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useAgencyCalls from '@/hooks/useAgencyCalls';
import AgencyCallBanner from '@/components/voice/AgencyCallBanner';

export default function GlobalAgencyCall() {
  const { user } = useCurrentUser();
  const { call, dismiss } = useAgencyCalls();
  const navigate = useNavigate();
  if (!call || call.sender_id === user?.id) return null;
  return createPortal(
    <div className="fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-[10000] mx-auto w-full max-w-lg" role="status">
      <AgencyCallBanner call={call} onClose={dismiss} onJoin={() => {
        const target = call.room_id;
        dismiss();
        if (target) navigate(`/sesli-oda/${target}`);
      }} />
    </div>, document.body,
  );
}