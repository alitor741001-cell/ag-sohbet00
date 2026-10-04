import { useState } from 'react';
import { EyeOff, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { vipLevelOf } from '@/lib/userLevels';

const REQUIRED_VIP = 10;

/**
 * Gizli Kullanıcı: VIP10 ve üzeri hesaplarda açılır.
 * Buton VIP olmasa da her zaman görünür; VIP10 yoksa aktif edilemez.
 */
export default function HiddenUserCard({ user, onUpdated }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const level = vipLevelOf(user);
  const unlocked = level >= REQUIRED_VIP;
  const enabled = !!user?.hidden_user;

  const toggle = async () => {
    if (!unlocked) return;
    setSaving(true);
    try {
      const response = await base44.functions.invoke('vip-bag', { action: 'hidden', enabled: !enabled });
      if (!response.data?.ok) throw new Error(response.data?.error || 'Kaydedilemedi.');
      toast({
        title: response.data.hidden_user ? 'Gizli kullanıcı açıldı' : 'Gizli kullanıcı kapatıldı',
        description: response.data.hidden_user ? 'Odalara görünmeden girersin.' : 'Odalarda yeniden görünürsün.',
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
            ? `VIP${REQUIRED_VIP} ve üzeri hesaplarda aktif edilir (VIP${level}).`
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