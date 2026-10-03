import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Yeni büyük kazançlar geldikçe liste ve şerit kendini yeniler.
const REFRESH_MS = 12000;

/** 20.000 coin üzeri kazançları (isim, profil, tutar, semboller) düzenli olarak getirir. */
export default function useBigWins() {
  const [winners, setWinners] = useState([]);
  const [me, setMe] = useState('');
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const response = await base44.functions.invoke('slot-game', { action: 'bigwins' });
      setWinners(response.data?.winners || []);
      setMe(response.data?.me || '');
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  return { winners, me, status };
}