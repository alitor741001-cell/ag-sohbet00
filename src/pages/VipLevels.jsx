import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useVipCosmetics from '@/hooks/useVipCosmetics';
import VipBagPanel from '@/components/profile/VipBagPanel';
import VipPageHeader from '@/components/vip/VipPageHeader';
import VipLevelHero from '@/components/vip/VipLevelHero';
import VipCosmeticGrid from '@/components/vip/VipCosmeticGrid';
import VipPrivilegeList from '@/components/vip/VipPrivilegeList';
import VipPreviewDialog from '@/components/vip/VipPreviewDialog';
import VipPurchasePanel from '@/components/vip/VipPurchasePanel';
import { vipVars } from '@/components/vip/vipTheme';
export default function VipLevels() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const data = useVipCosmetics(true);
  const [level, setLevel] = useState(5);
  const [bagOpen, setBagOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [preview, setPreview] = useState(null);
  const theme = data.catalog?.levels.find((item) => item.level === level);
  if (!theme) return <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">{data.loading ? <Loader2 className="animate-spin" /> : <><p>{data.error || 'VIP bilgileri yüklenemedi.'}</p><button onClick={data.refresh}>Tekrar dene</button></>}</div>;
  return <div className="vip-world min-h-screen pb-[calc(7rem+env(safe-area-inset-bottom))] font-body" style={vipVars(theme)}>
    {/* Tema zemini ekrana sabitlenir: sayfa kayarken görsel yukarı/aşağı, sağa/sola kaymaz. */}
    <div className="vip-world-fixed" aria-hidden="true" />
    <div className="relative z-10 mx-auto max-w-lg">
      <VipPageHeader onBack={() => window.history.length > 1 ? navigate(-1) : navigate('/')} onBag={() => setBagOpen(true)} onHelp={() => setHelp(!help)} />
      {help && <p className="vip-glass m-3 rounded-xl p-4 text-xs leading-relaxed">VIP 5 başlangıç, VIP 12 en üst seviyedir. Seçtiğin VIP'i aşağıdaki sabit alandan Coins ile 30 günlük satın alabilirsin; varsa kalan süreye 30 gün eklenir. VIP 6: 7.200.000 Coins, VIP 7: 21.600.000 Coins. Çantandaki üyelikleri kullanma ve hediye etme seçenekleri korunur. Süre dolunca kozmetikler saklanır, kullanım hakları durur.</p>}
      <VipLevelHero theme={theme} levels={data.catalog.levels} onLevel={setLevel} />
      <VipCosmeticGrid theme={theme} features={data.catalog.features} onPreview={setPreview} avatar={user?.avatar} name={user?.username || user?.full_name} />
      <VipPrivilegeList level={level} features={data.catalog.features} />
      {data.error && <p role="alert" className="px-4 text-sm text-destructive">{data.error}</p>}
    </div>
    <VipPurchasePanel theme={theme} level={data.level} expiresAt={data.expires_at} onChanged={data.refresh} />
    <VipPreviewDialog preview={preview} onClose={() => setPreview(null)} avatar={user?.avatar} name={user?.username || user?.full_name} />
    <VipBagPanel open={bagOpen} onClose={() => { setBagOpen(false); data.refresh(); }} onChanged={data.refresh} />
  </div>;
}