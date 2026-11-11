import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

/**
 * Masadaki jetonlar: turun bütün oyuncularının bahisleri.
 * Her oyuncu kendi bahsini yerel olarak gösterir; bu kanca karşı tarafın
 * jetonlarını verir (kendi kayıtları listeye katılmaz).
 */
export default function useTableBets(game, roundNo, selfId) {
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    if (!game || !roundNo) {
      setRows([]);
      return;
    }
    try {
      const items = await base44.entities.GameTableBet.filter({ game, round_no: roundNo });
      setRows(Array.isArray(items) ? items : items?.items || []);
    } catch (error) {
      setRows([]);
    }
  }, [game, roundNo]);

  useEffect(() => { load(); }, [load]);

  // Masaya yeni jeton konduğunda (bütün oyuncular için) liste tazelenir.
  useEffect(() => subscribeEntity('GameTableBet', (event) => {
    const data = event?.data;
    if (data && (data.game !== game || data.round_no !== roundNo)) return;
    load();
  }), [game, roundNo, load]);

  const chips = {};
  const totals = {};
  rows.forEach((row) => {
    if (selfId && row.user_id === selfId) return;
    (row.bets || []).forEach((bet) => {
      const stake = bet?.amount || 0;
      if (!bet?.block || stake <= 0) return;
      if (!chips[bet.block]) chips[bet.block] = [];
      chips[bet.block].push({
        user_id: row.user_id,
        user_name: row.user_name,
        user_avatar: row.user_avatar,
        stake,
      });
      totals[bet.block] = (totals[bet.block] || 0) + stake;
    });
  });

  return { chips, totals };
}