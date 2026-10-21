import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

/** VIP kimlik rozeti ürünleri: rozet, çerçeve, banner, mikrofon dalgası, balon, kart, araç, oda kartı, koltuk. */
export const VIP_COSMETIC_LABELS = {
  badge: 'Kimlik Rozeti',
  frame: 'Avatar Çerçevesi',
  banner: 'Giriş Bannerı',
  mic: 'Mikrofon Dalgası',
  bubble: 'Sohbet Balonu',
  card: 'Profil Kartı',
  ride: 'VIP Aracı',
  'room-card': 'Oda Kartı',
  seat: 'Oda VIP Koltuğu',
};

/** VIP ürünlerini yükler ve tek tek etkinleştirme/kaldırma yapar. */
export default function useVipCosmetics(enabled = true) {
  const [items, setItems] = useState([]);
  const [level, setLevel] = useState(0);
  const [loading, setLoading] = useState(!!enabled);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('vip-cosmetics', { action: 'list' });
      setItems(response.data?.items || []);
      setLevel(Number(response.data?.level) || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  const toggle = async (kind, active) => {
    setBusy(kind);
    // Anında geri bildirim: düğme beklemeden yeni duruma geçer.
    setItems((current) => current.map((item) => (item.kind === kind ? { ...item, active } : item)));
    try {
      await base44.functions.invoke('vip-cosmetics', { action: 'toggle', kind, active });
    } catch {
      setItems((current) => current.map((item) => (item.kind === kind ? { ...item, active: !active } : item)));
    } finally {
      setBusy('');
    }
  };

  return { items, level, loading, busy, toggle, refresh: load };
}