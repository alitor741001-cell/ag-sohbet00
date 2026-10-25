import { useEffect, useRef, useState } from 'react';
import gameRequest from '@/lib/gameRequest';
import { ANKA_BETS, ANKA_LINES } from '@/components/games/anka/ankaConfig';
import { useCurrentUser } from '@/lib/useCurrentUser';
import useWalletCoinsLive from '@/hooks/useWalletCoinsLive';
export default function useAnkaGame() {
  const [state, setState] = useState({ bet: 100, coins: 0, free_spins: 0, win: 0 });
  const [status, setStatus] = useState('loading'), [busy, setBusy] = useState(false), [rolling, setRolling] = useState(false);
  const [auto, setAuto] = useState(false), [message, setMessage] = useState(''), [prize, setPrize] = useState(null);
  const lock = useRef(false), stopped = useRef(false), alive = useRef(true), wake = useRef(null);
  const { user } = useCurrentUser();
  useWalletCoinsLive(user?.id, coins => setState(s => ({ ...s, coins })));
  useEffect(() => {
    alive.current = true;
    gameRequest('ankaGame', { action: 'state' }).then(({ data }) => { if (alive.current) { setState(data); setStatus('ready'); } })
      .catch(e => { if (alive.current) { setStatus('error'); setMessage(e?.response?.data?.error || 'Oyun yüklenemedi. Geri dönüp tekrar aç.'); } });
    return () => { alive.current = false; wake.current?.(); };
  }, []);
  async function act(action, bet = state.bet) {
    if (lock.current || status !== 'ready') return;
    lock.current = true; setBusy(true); setMessage(''); stopped.current = false;
    if (action === 'spin') { setRolling(true); setState(s => ({ ...s, win: 0, wins: [], jackpot: null })); }
    try {
      const { data } = await gameRequest('ankaGame', { action, bet, request_id: crypto.randomUUID() });
      if (action === 'spin' && !stopped.current && alive.current) await new Promise(resolve => { const timer = setTimeout(resolve, 1050); wake.current = () => { clearTimeout(timer); resolve(); }; });
      if (!alive.current) return;
      setState(data);
      if (data.bonus_result !== undefined) setPrize({ title: 'ANKA TURLARI TAMAMLANDI', amount: data.bonus_result });
      else if (data.jackpot) setPrize({ title: `${data.jackpot.tier} JACKPOT`, amount: data.jackpot.amount });
    } catch (e) { if (alive.current) { setMessage(e?.response?.data?.error || 'İşlem tamamlanamadı. Tekrar dene.'); setAuto(false); } }
    finally { lock.current = false; wake.current = null; if (alive.current) { setBusy(false); setRolling(false); } }
  }
  useEffect(() => {
    if (busy || prize || message || status !== 'ready' || (!auto && !state.free_spins)) return;
    const timer = setTimeout(() => act('spin'), 1100);
    return () => clearTimeout(timer);
  }, [busy, auto, state.free_spins, prize, message, status]);
  const step = direction => { const i = ANKA_BETS.indexOf(state.bet); act('bet', ANKA_BETS[Math.max(0, Math.min(ANKA_BETS.length - 1, i + direction))]); };
  const max = () => act('bet', [...ANKA_BETS].reverse().find(b => b * ANKA_LINES <= state.coins) || ANKA_BETS[0]);
  return { ...state, status, busy, rolling, auto, message, prize, step, max, spin: () => act('spin'), buy: () => act('session'),
    stop: () => { stopped.current = true; wake.current?.(); }, toggleAuto: () => setAuto(a => !a), clearPrize: () => setPrize(null) };
}