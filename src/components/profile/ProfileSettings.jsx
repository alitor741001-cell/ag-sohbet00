import { Palette } from 'lucide-react';
import ThemeModeSelector from '@/components/profile/ThemeModeSelector';
import HiddenUserCard from '@/components/profile/HiddenUserCard';
import VipExtensionSettings from '@/components/profile/VipExtensionSettings';

const ROW = 'rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3';

/** Eklentiler: gizli kullanıcı, hareketli avatar, gizli profil, oda takibi, ziyaretçiler ve görünüm. */
export default function ProfileSettings({ user, onUpdated }) {
  return (
    <div className="space-y-2.5">
      <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-white/35">Gizlilik ve Görünüm</p>
      <HiddenUserCard user={user} onUpdated={onUpdated} />
      <VipExtensionSettings />

      <p className="px-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-white/35">Uygulama</p>
      <div className={ROW}>
        <div className="mb-3 flex items-center gap-3">
          <Palette className="h-[18px] w-[18px] shrink-0 text-white/60" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Görünüm</p>
            <p className="text-[11px] font-semibold text-white/45">Uygulama temasını seç</p>
          </div>
        </div>
        <ThemeModeSelector />
      </div>
    </div>
  );
}