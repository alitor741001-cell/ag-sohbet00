import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

// Sıralama ve numara geçmişi son turlardan okunur.
const BOARD_LIMIT = 30;
const RECENT_LIMIT = 9;

/** Tur sonuçlarını izler: en çok kazanan üç oyuncu ve son çıkan numaralar. */
export default function useRouletteBoard(round = 0) {
  const [spins, setSpins] = useState([]);
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    try {
      const rows = await base44.entities.RouletteSpin.list('-created_date', BOARD_LIMIT);
      setSpins(rows || []);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  }, []);

  // Kendi turum biter bitmez liste yenilenir.
  useEffect(() => { load(); }, [load, round]);

  // Odadaki her tur anında yayılır: sıralama kendiliğinden güncellenir.
  useEffect(() => base44.entities.RouletteSpin.subscribe(() => { load(); }), [load]);

  const winners = [...spins]
    .filter((spin) => (spin.payout ?? 0) > 0)
    .sort((a, b) => (b.payout ?? 0) - (a.payout ?? 0))
    .slice(0, 3);

  return { winners, recent: spins.slice(0, RECENT_LIMIT), status };
}