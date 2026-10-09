import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import subscribeEntity from '@/components/data/entitySubscriptions';
import { ZONE_IDS } from './zarConfig';

// Turun masaya konan bahisleri: en büyük jetonlar gösterilir, masa taşmaz.
const CHIP_LIMIT = 60;
// Alan toplamları sunucuda hesaplanır ve yeni bahislerde en çok bu aralıkla tazelenir.
const TOTALS_MIN_GAP_MS = 5000;

/** Turun tutarları: her bahis alanına masadaki oyuncuların yatırdığı miktarlar
    (profil bilgisi olmadan) ve alanın canlı toplamı. Masadaki herkes aynı
    tutarları görür. */
export default function useZarBets(round = 0, selfId = '') {
  const [chips, setChips] = useState({});
  const [totals, setTotals] = useState({});
  const totalsAt = useRef(0);

  const loadChips = useCallback(async () => {
    if (!round) {
      setChips({});
      return;
    }
    const page = await base44.entities.ZarBet.filter(
      { round_no: round },
      { sort: '-stake', limit: CHIP_LIMIT, fields: ['kind', 'stake', 'user_id'] }
    );
    const grouped = {};
    (page?.items || []).forEach((row) => {
      // Kendi bekleyen bahsi ayrı jetonla gösterilir: listede tekrar etmez.
      if (selfId && row.user_id === selfId) return;
      if (!grouped[row.kind]) grouped[row.kind] = [];
      grouped[row.kind].push({ user_id: row.user_id, stake: row.stake || 0 });
    });
    setChips(grouped);
  }, [round, selfId]);

  // Alan toplamı: masadaki bütün oyuncuların o alana yatırdığı tutar.
  const loadTotals = useCallback(async () => {
    if (!round) {
      setTotals({});
      return;
    }
    totalsAt.current = Date.now();
    const result = await base44.entities.ZarBet.aggregate({
      query: { round_no: round },
      groupBy: 'kind',
      sum: 'stake',
    });
    const next = {};
    (result?.rows || []).forEach((row) => {
      if (ZONE_IDS.includes(row.kind)) next[row.kind] = row.sum_stake || 0;
    });
    setTotals(next);
  }, [round]);

  useEffect(() => { loadChips().catch(() => {}); }, [loadChips]);
  useEffect(() => { loadTotals().catch(() => {}); }, [loadTotals]);

  // Odaya yeni bahis konduğunda tutarlar anında masaya düşer; alan toplamları
  // aynı yoğunlukta sorgulanmaz, bekleme aralığıyla tazelenir.
  useEffect(() => subscribeEntity('ZarBet', () => {
    loadChips().catch(() => {});
    if (Date.now() - totalsAt.current >= TOTALS_MIN_GAP_MS) loadTotals().catch(() => {});
  }), [loadChips, loadTotals]);

  return { chips, totals };
}