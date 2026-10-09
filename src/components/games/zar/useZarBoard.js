import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ZONE_IDS } from './zarConfig';

// Sıralama son turun kayıtlarından okunur.
const BOARD_LIMIT = 40;
// En çok kazanan dört oyuncu gösterilir: referans tasarımdaki TOP1-TOP4 şeridi.
const TOP_COUNT = 4;

/** Turun alan toplamlarını ve en çok kazanan oyuncularını izler. */
export default function useZarBoard(round = 0) {
  const [rows, setRows] = useState([]);
  const [zoneTotals, setZoneTotals] = useState({});
  const [status, setStatus] = useState('loading');

  const load = useCallback(async () => {
    if (!round) return;
    try {
      const page = await base44.entities.ZarBet.filter(
        { round_no: round }, { sort: '-payout', limit: BOARD_LIMIT }
      );
      setRows(page?.items || []);
      setStatus('ready');
    } catch (error) {
      setStatus('error');
    }
  }, [round]);

  // Her turda ve odadaki her sonuçta sıralama tazelenir.
  useEffect(() => { load(); }, [load]);
  useEffect(() => base44.entities.ZarBet.subscribe(() => { load(); }), [load]);

  // Alan toplamları sunucuda hesaplanır: masadaki bütün bahislerin toplamı.
  useEffect(() => {
    let cancelled = false;
    if (!round) return undefined;
    base44.entities.ZarBet.aggregate({ query: { round_no: round }, groupBy: 'kind', sum: 'stake' })
      .then((result) => {
        if (cancelled) return;
        const totals = {};
        (result?.rows || []).forEach((row) => {
          if (ZONE_IDS.includes(row.kind)) totals[row.kind] = row.sum_stake || 0;
        });
        setZoneTotals(totals);
      })
      .catch(() => { if (!cancelled) setZoneTotals({}); });
    return () => { cancelled = true; };
  }, [round]);

  // Aynı oyuncu birden fazla alana oynayabilir: oyuncu başına toplam kazanç alınır.
  const byUser = new Map();
  rows.forEach((row) => {
    const payout = row.payout ?? 0;
    const current = byUser.get(row.user_id);
    if (current) {
      current.payout += payout;
      return;
    }
    byUser.set(row.user_id, {
      user_id: row.user_id,
      user_name: row.user_name,
      user_avatar: row.user_avatar,
      payout,
    });
  });
  const winners = [...byUser.values()]
    .filter((entry) => entry.payout > 0)
    .sort((a, b) => b.payout - a.payout)
    .slice(0, TOP_COUNT);

  return { winners, zoneTotals, status };
}