import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';

// Turun masaya konan bahisleri: en büyük jetonlar gösterilir, masa taşmaz.
const CHIP_LIMIT = 60;

/** Turun jetonları: her bahis alanı için oraya yatıran oyuncuların tutarları. */
export default function useZarBets(round = 0) {
  const [chips, setChips] = useState({});

  const load = useCallback(async () => {
    if (!round) {
      setChips({});
      return;
    }
    const page = await base44.entities.ZarBet.filter(
      { round_no: round },
      { sort: '-stake', limit: CHIP_LIMIT, fields: ['kind', 'stake', 'user_id', 'user_name'] }
    );
    const grouped = {};
    (page?.items || []).forEach((row) => {
      if (!grouped[row.kind]) grouped[row.kind] = [];
      grouped[row.kind].push({ user_id: row.user_id, user_name: row.user_name, stake: row.stake || 0 });
    });
    setChips(grouped);
  }, [round]);

  useEffect(() => { load().catch(() => setChips({})); }, [load]);
  // Odaya yeni bahis konduğunda jetonlar anında masaya düşer.
  useEffect(() => subscribeEntity('ZarBet', () => { load().catch(() => {}); }), [load]);

  return chips;
}