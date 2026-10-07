import { useState } from 'react';
import { EyeOff, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { vipLevelOf } from '@/lib/userLevels';
import { HIDDEN_REQUIRED_VIP, hiddenUnlocked } from '@/lib/hiddenUser';

/**
 * Gizli Kullanıcı: VIP10 ve üzeri hesaplarda açılır; yönetici hesabı VIP şartı olmadan açar.
 * Buton her zaman görünür; kilidi olmayan hesap aktif edemez.
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
    <section className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? 'bg-emerald-500/15' : 'bg-secondary'}`}>
        {unlocked ? <EyeOff className={`h-5 w-5 ${enabled ? 'text-emerald-400' : 'text-muted-foreground'}`} /> : <Lock className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold">Gizli Kullanıcı</p>
        <p className="text-xs text-muted-foreground">
          {!unlocked
            ? `VIP${HIDDEN_REQUIRED_VIP} ve üzeri hesaplarda aktif edilir (VIP${level}).`
            : adminBypass
              ? 'Yönetici hesabı — VIP şartı aranmaz.'
              : enabled
                ? 'Açık — odalara görünmeden giriyorsun.'
                : 'Kapalı — odalarda görünürsün.'}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={saving || !unlocked}
        className={`shrink-0 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors disabled:opacity-40 ${enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-primary text-primary-foreground'}`}
      >
        {saving ? '...' : enabled ? 'Kapat' : 'Aktif Et'}
      </button>
    </section>
  );
}