import { lazy, Suspense } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useAgOfficial from '@/hooks/useAgOfficial';
const Support = lazy(() => import('@/pages/Support'));
const OfficialInbox = lazy(() => import('@/components/support/OfficialInbox'));
export default function SupportEntry() {
  const { user, loading } = useCurrentUser();
  const official = useAgOfficial(user?.id);
  if (loading || official.loading) return <p className="p-4 text-muted-foreground">Yükleniyor...</p>;
  return <Suspense fallback={<p className="p-4">Yükleniyor...</p>}>{official.active ? <OfficialInbox /> : <Support />}</Suspense>;
}