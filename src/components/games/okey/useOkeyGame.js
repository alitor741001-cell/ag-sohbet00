import { useCallback, useEffect, useRef, useState } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
import { useCurrentUser } from '@/lib/useCurrentUser';
import gameRequest from '@/lib/gameRequest';

// Elde olmayan değişiklikleri (sıra, süre aşımı, bitirme) yakalamak için yoklama aralığı.
const POLL_MS = 4000;

/** 101 OKEY istemcisi: lobi, masa durumu, kendi eli ve tur işlemleri. */
export default function useOkeyGame() {
  const { user } = useCurrentUser();
  const [coins, setCoins] = useState(0);
  const [lobby, setLobby] = useState({ tables: [], my_table_id: '' });
  const [lobbyLoading, setLobbyLoading] = useState(true);
  const [tableId, setTableId] = useState('');
  const [table, setTable] = useState(null);
  const [hand, setHand] = useState([]);
  const [drawnTile, setDrawnTile] = useState('');
  const [seat, setSeat] = useState(-1);
  const [canFinish, setCanFinish] = useState(false);
  const [handScore, setHandScore] = useState(0);
  const [finishScore, setFinishScore] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const tableRef = useRef(null);

  useWalletCoinsLive(user?.id, (value) => setCoins(value));

  const apply = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (data.table) {
      tableRef.current = data.table;
      setTable(data.table);
      setTableId(data.table.id);
    }
    if (Array.isArray(data.hand)) setHand(data.hand);
    if (typeof data.seat === 'number') setSeat(data.seat);
    setCanFinish(!!data.can_finish);
    setHandScore(Number(data.hand_score) || 0);
    setFinishScore(Number(data.finish_score) || 0);
  }, []);

  const request = useCallback(
    async (payload) => {
      setBusy(true);
      try {
        const response = await gameRequest('okey-game', payload);
        const data = response?.data || {};
        setError(data.error || '');
        apply(data);
        return data;
      } catch (err) {
        setError(err?.response?.data?.error || 'Bağlantı kurulamadı.');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [apply],
  );

  const openLobby = useCallback(async () => {
    setLobbyLoading(true);
    const data = await request({ action: 'lobby' });
    if (data) {
      setLobby({ tables: data.tables || [], my_table_id: data.my_table_id || '' });
      if (data.my_table_id) await request({ action: 'state', table_id: data.my_table_id });
      else { setTableId(''); }
    }
    setLobbyLoading(false);
  }, [request]);

  useEffect(() => {
    if (!user?.id) return;
    openLobby();
  }, [user?.id, openLobby]);

  // Masayı canlı izle: masa kaydı değişince eli tazele.
  const refresh = useCallback(() => {
    if (!tableId) return;
    request({ action: 'state', table_id: tableId });
  }, [tableId, request]);

  useEffect(() => {
    if (!tableId) return undefined;
    let timer = null;
    const off = subscribeEntity('OkeyTable', (event) => {
      const row = event?.data;
      if (!row || row.id !== tableId) return;
      const seen = tableRef.current;
      tableRef.current = row;
      setTable(row);
      const moved = !seen || seen.turn !== row.turn || seen.phase !== row.phase || seen.status !== row.status || (seen.discards || []).length !== (row.discards || []).length;
      if (!moved) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, 700);
    });
    const poll = window.setInterval(refresh, POLL_MS);
    return () => {
      off();
      window.clearTimeout(timer);
      window.clearInterval(poll);
    };
  }, [tableId, refresh]);

  const actions = {
    quickPlay: async (bet) => {
      const data = await request({ action: 'quick_join', bet });
      if (data?.table) setLobby((prev) => ({ ...prev, my_table_id: data.table.id }));
    },
    joinTable: (id) => request({ action: 'join', table_id: id }),
    setStake: (stake) => request({ action: 'stake', table_id: tableId, stake }),
    start: () => request({ action: 'start', table_id: tableId }),
    draw: async () => {
      const before = [...hand];
      const data = await request({ action: 'draw', table_id: tableId });
      if (!data?.error && Array.isArray(data?.hand)) {
        const added = data.hand.filter((tile) => {
          const index = before.indexOf(tile);
          if (index < 0) return true;
          before.splice(index, 1);
          return false;
        });
        setDrawnTile(added[0] || '');
      }
    },
    discard: async (tile) => {
      const data = await request({ action: 'discard', table_id: tableId, tile });
      if (data && !data.error) setDrawnTile('');
      return data;
    },
    finish: () => request({ action: 'finish', table_id: tableId }),
    leave: async () => {
      if (tableId) await request({ action: 'leave', table_id: tableId });
      setTable(null);
      tableRef.current = null;
      setHand([]);
      setDrawnTile('');
      setSeat(-1);
      setCanFinish(false);
      setHandScore(0);
      setFinishScore(0);
      await openLobby();
    },
  };

  return { user, coins, lobby, lobbyLoading, table, hand, drawnTile, seat, canFinish, handScore, finishScore, busy, error, setError, refresh, openLobby, actions };
}