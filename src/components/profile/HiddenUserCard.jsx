import { useState } from 'react';
import { EyeOff, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { vipLevelOf } from '@/lib/userLevels';
import { HIDDEN_REQUIRED_VIP, hiddenUnlocked } from '@/lib/hiddenUser';
import SettingSwitch from '@/components/profile/SettingSwitch';

/**
 * Gizli Kullanıcı: VIP10 ve üzeri hesaplarda açılır; yönetici hesabı VIP şartı olmadan açar.
 * Anahtar her zaman görünür; kilidi olmayan hesap aktif edemez.
 */
export default function HiddenUserCard({ user, onUpdated }) {
  const { toast } = useToast();
  const { setUser } = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const level = vipLevelOf(user);
  const unlocked = hiddenUnlocked(user);
  // Yönetici hesabı, VIP seviyesi yetersiz olsa da gizli modu açabilir.
  const adminBypass = user?.role === 'admin' && level < HIDDEN_REQUIRED_VIP;
  const enabled = !!user?.hidden_user;

  const toggle = async () => {
    if (!unlocked) return;
    setSaving(true);
    try {
      const response = await base44.functions.invoke('vip-bag', { action: 'hidden', enabled: !enabled });
      if (!response.data?.ok) throw new Error(response.data?.error || 'Kaydedilemedi.');
      // Ayar her yerde anında geçerli olsun: oturumdaki kullanıcı kaydı da canlı güncellenir.
      const hidden = !!response.data.hidden_user;
      setUser((prev) => (prev ? { ...prev, hidden_user: hidden } : prev));
      toast({
        title: hidden ? 'Gizli kullanıcı açıldı' : 'Gizli kullanıcı kapatıldı',
        description: hidden ? 'Odalarda anında görünmez olursun.' : 'Odalarda anında yeniden görünürsün.',
      });
      onUpdated?.();
    } catch (error) {
      toast({ title: 'Kaydedilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3">
      <div className="flex items-center gap-3">
        {unlocked
          ? <EyeOff className={`h-[18px] w-[18px] shrink-0 ${enabled ? 'text-green-400' : 'text-white/60'}`} />
          : <Lock className="h-[18px] w-[18px] shrink-0 text-white/40" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">Gizli Kullanıcı</p>
          <p className="text-[11px] font-semibold text-white/45">
            {!unlocked
              ? `VIP${HIDDEN_REQUIRED_VIP}+ gerekir (VIP${level})`
              : adminBypass
                ? 'Yönetici hesabı · VIP şartı yok'
                : enabled ? 'Açık · odalarda görünmüyorsun' : 'Kapalı · odalarda görünürsün'}
          </p>
        </div>
        <SettingSwitch checked={enabled} disabled={saving || !unlocked} onChange={toggle} label="Gizli Kullanıcı" />
      </div>
    </div>
  );
}