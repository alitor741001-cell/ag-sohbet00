import { Loader2 } from 'lucide-react';
import useVipPreferences from '@/hooks/useVipPreferences';
import VipExtensionCard from '@/components/profile/VipExtensionCard';

// Satır sırası: hareketli avatar, gizli profil, oda takibi, diğerleri.
const ORDER = ['avatar', 'stealth-visit', 'room-privacy'];

export default function VipExtensionSettings() {
  const preferences = useVipPreferences();
  const features = preferences.features
    .filter((feature) => feature.key !== 'visitors')
    .sort((a, b) => {
      const indexA = ORDER.indexOf(a.key);
      const indexB = ORDER.indexOf(b.key);
      return (indexA === -1 ? ORDER.length : indexA) - (indexB === -1 ? ORDER.length : indexB);
    });

  return (
    <div className="space-y-2.5">
      {preferences.error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {preferences.error}
          <button type="button" onClick={preferences.refresh} className="ml-2 underline">Yeniden dene</button>
        </div>
      )}
      {preferences.loading ? (
        <Loader2 aria-label="Eklentiler yükleniyor" className="mx-auto h-5 w-5 animate-spin text-white/60" />
      ) : (
        features.map((feature) => (
          <VipExtensionCard key={feature.key} feature={feature} busy={preferences.busy} onToggle={preferences.toggle} />
        ))
      )}
    </div>
  );
}