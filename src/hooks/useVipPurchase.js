import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { publishWalletCoins } from '@/hooks/useWalletCoinsLive';

export default function useVipPurchase(onChanged) {
  const { user, setUser } = useCurrentUser();
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const buy = async (level) => {
    if (running.current || !user?.id) return;
    running.current = true; setBusy(true); setError(''); setNotice('');
    const key = `vip-purchase-pending:${user.id}`;
    try {
      let pending = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (pending && pending.level !== level) {
        setError(`Önce VIP ${pending.level} için yarım kalan satın almayı tekrar deneyerek tamamla.`);
        return;
      }
      if (!pending) {
        pending = { level, request_id: crypto.randomUUID() };
        sessionStorage.setItem(key, JSON.stringify(pending));
      }
      const { data } = await base44.functions.invoke('vip-bag', { action: 'buy', ...pending });
      sessionStorage.removeItem(key);
      setUser((current) => ({ ...current, vip_level: data.level, vip_expires_at: data.expires_at }));
      publishWalletCoins(user.id, data.coins);
      setNotice(`VIP ${data.purchased_level} satın alındı; 30 günlük üyeliğin etkinleştirildi.`);
      window.dispatchEvent(new Event('vip-cosmetics-changed'));
      onChanged?.();
    } catch (failure) {
      const status = failure.response?.status;
      if ([400, 402, 403].includes(status)) sessionStorage.removeItem(key);
      if (Number.isFinite(failure.response?.data?.coins)) publishWalletCoins(user.id, failure.response.data.coins);
      setError(failure.response?.data?.error || 'Satın alma tamamlanamadı; aynı VIP için tekrar deneyerek işlemi tamamla.');
    } finally { running.current = false; setBusy(false); }
  };
  return { buy, busy, error, notice };
}