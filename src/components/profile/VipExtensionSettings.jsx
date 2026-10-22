import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import useVipPreferences from '@/hooks/useVipPreferences';
import VipExtensionCard from '@/components/profile/VipExtensionCard';
import SocialListDialog from '@/components/profile/social/SocialListDialog';
export default function VipExtensionSettings() {
  const preferences = useVipPreferences();
  const [visitorsOpen, setVisitorsOpen] = useState(false);
  return <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
    <h3 className="font-bold">VIP Eklentileri</h3>
    <p className="mb-3 mt-1 text-xs text-muted-foreground">Ayarların hesabına kaydedilir; VIP seviyesi ve süresi otomatik kontrol edilir.</p>
    {preferences.error && <div role="alert" className="mb-3 text-sm text-destructive">{preferences.error}<button type="button" onClick={preferences.refresh} className="ml-2 underline">Yeniden dene</button></div>}
    {preferences.loading ? <Loader2 aria-label="VIP ayarları yükleniyor" className="mx-auto h-5 w-5 animate-spin" /> : <div className="space-y-3">{preferences.features.map(feature => <VipExtensionCard key={feature.key} feature={feature} busy={preferences.busy} onToggle={preferences.toggle} onVisitors={() => setVisitorsOpen(true)} />)}</div>}
    <SocialListDialog open={visitorsOpen} kind="visitors" onClose={() => setVisitorsOpen(false)} />
  </section>;
}