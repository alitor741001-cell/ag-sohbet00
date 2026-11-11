import { useCallback, useEffect, useRef, useState } from 'react';
import subscribeEntity from '@/components/data/entitySubscriptions';
import rouletteRequests from './rouletteRequests';
import { CHIP_LEVELS } from './rouletteConfig';

// Geri sayım bu aralıkla iner; tur aşaması da aynı saate göre okunur.
const CLOCK_TICK = 100;
// Sunucu yoklaması: abonelik geldiğinde atlanır, yalnızca güvenlik ağıdır.
const POLL_EDGE_MS = 1200;
const POLL_SPIN_MS = 8000;
const POLL_IDLE_MS = 20000;
const POLL_HIDDEN_MS = 15000;
const POLL_ERROR_MS = 5000;
// Abonelik olayı geldikten sonra bu süre boyunca yoklama yapılmaz.
const EVENT_GRACE_MS = 15000;

/** Tur aşaması yerel saatle de ilerler: bahis süresi dolduğu saniyede çark döner. */
function phaseAt(round, now) {
  if (!round) return 'betting';
  if (round.status === 'betting') {
    return now >= new Date(round.phase_ends_at).getTime() ? 'spinning' : 'betting';
  }
  return now >= new Date(round.ends_at).getTime() ? 'next' : 'spinning';
}

/** Yayından gelen tur: numara yalnızca çark dönerken açılır. */
function liveRound(live) {
  if (!live || typeof live.round_no !== 'number') return null;
  const revealed = live.status === 'spinning';
  return {
    round_no: live.round_no,
    status: revealed ? 'spinning' : 'betting',
    started_at: live.started_at,
    phase_ends_at: live.phase_ends_at,
    ends_at: live.ends_at,
    number: revealed ? live.number : null,
    index: revealed ? live.index : null,
  };
}

const at = (value) => {
  const time = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
};

/** ROULETTE turu: 20 saniye bahis, sonra çark ve sonuç; tur kendi kendine döner. */
export default function useRouletteGame() {
  const [status, setStatus] = useState('loading');
  const [coins, setCoins] = useState(0);
  const [totalWon, setTotalWon] = useState(0);
  const [spins, setSpins] = useState(0);
  const [chip, setChip] = useState(CHIP_LEVELS[0]);
  // Masadaki bahisler: blok kimliği -> o bloğa konan toplam coin.
  const [bets, setBets] = useState({});
  const [lastBets, setLastBets] = useState(null);
  const [round, setRound] = useState(null);
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState(null);
  const [payout, setPayout] = useState(0);
  const [message, setMessage] = useState('');
  const [clock, setClock] = useState(Date.now());

  const serverNowRef = useRef(Date.now());
  const fetchedAtRef = useRef(Date.now());
  const roundRef = useRef(null);
  const betsRef = useRef({});
  // Hangi turda bahis oynandı: aynı turda ikinci istek gitmez.
  const firedRef = useRef(0);
  const busyRef = useRef(false);
  const cooldownRef = useRef(0);
  // Abonelik olayı geldikçe güncellenir: yoklama yalnızca uzun sessizlikte çalışır.
  const lastEventRef = useRef(0);

  useEffect(() => { betsRef.current = bets; }, [bets]);

  const applyWallet = useCallback((data) => {
    if (!data) return;
    if (typeof data.coins === 'number') setCoins(data.coins);
    if (typeof data.total_won === 'number') setTotalWon(data.total_won);
    if (typeof data.spins === 'number') setSpins(data.spins);
  }, []);

  const applyRound = useCallback((next, now) => {
    if (!next) return;
    if (typeof now === 'number') {
      // Sunucu saati yerel saatle akar: geri sayım iki ekranda aynı saniyeyi gösterir.
      serverNowRef.current = Math.max(serverNowRef.current + (Date.now() - fetchedAtRef.current), now);
      fetchedAtRef.current = Date.now();
    }
    roundRef.current = next;
    setRound((prev) => {
      if (prev && next.round_no < prev.round_no) return prev;
      // Aynı turda yayın geri gitmez: numara açıldıktan sonra bahis aşamasına dönülmez.
      if (prev && next.round_no === prev.round_no && prev.status === 'spinning' && next.status === 'betting') return prev;
      return next;
    });
  }, []);

  const fetchState = useCallback(async () => {
    const data = await rouletteRequests({ action: 'state' });
    applyWallet(data);
    applyRound(data?.round, data?.now);
    if (Array.isArray(data?.history)) setHistory(data.history);
    setStatus('ready');
  }, [applyRound, applyWallet]);

  // İlk açılış: tur ve bakiye bir kez alınır.
  useEffect(() => {
    let cancelled = false;
    fetchState().catch((error) => {
      if (cancelled) return;
      setStatus('error');
      setMessage(error?.response?.data?.error || 'Oyun yüklenemedi.');
    });
    return () => { cancelled = true; };
  }, [fetchState]);

  // Yoklama turu ilerletir: kimse bahis koymasa da çark döner ve yeni tur açılır.
  useEffect(() => {
    let timer;
    let running = false;
    let cancelled = false;
    const loop = async () => {
      if (running || cancelled) return;
      running = true;
      // Sekme arka plandayken istek yapılmaz: bütçe oyuncunun turuna kalır.
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(loop, POLL_HIDDEN_MS);
        running = false;
        return;
      }
      // Abonelik yakın zamanda olay gönderdiyse yoklama atlanır: gereksiz istek yok.
      if (Date.now() - lastEventRef.current < EVENT_GRACE_MS) {
        timer = setTimeout(loop, EVENT_GRACE_MS);
        running = false;
        return;
      }
      // Bahis isteği sürerken yoklama yapılmaz: tur kapanışı bekletilmez.
      if (!busyRef.current && Date.now() >= cooldownRef.current) {
        try {
          await fetchState();
        } catch {
          cooldownRef.current = Date.now() + POLL_ERROR_MS;
        }
      }
      if (cancelled) return;
      const now = serverNowRef.current + (Date.now() - fetchedAtRef.current);
      const current = roundRef.current;
      const phase = phaseAt(current, now);
      const spinAt = current ? at(current.phase_ends_at) : null;
      const endAt = current ? at(current.ends_at) : null;
      // Tur ortasında seyrek yoklanır — istek bütçesi oyuncunun turuna kalır.
      const cadence = phase === 'spinning'
        ? POLL_SPIN_MS
        : spinAt !== null && spinAt - now <= 4000
          ? POLL_EDGE_MS
          : POLL_IDLE_MS;
      // Bekleme hiçbir zaman bir sonraki tur sınırını geçmez: seyrek yoklama
      // turun dönüşünü geciktirmez, çark tam zamanında döner.
      const edgeAt = phase === 'spinning' ? endAt : spinAt;
      const untilEdge = edgeAt !== null ? Math.max(400, edgeAt - now + 250) : cadence;
      const wait = Math.min(cadence, untilEdge);
      timer = setTimeout(loop, wait + Math.random() * 300);
      running = false;
    };
    loop();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [fetchState]);

  // Tur, numara ve geçmiş canlı yayından gelir: odadaki herkes aynı çarkı görür.
  useEffect(() => subscribeEntity('RouletteLive', (event) => {
    lastEventRef.current = Date.now();
    const live = event?.data;
    applyRound(liveRound(live));
    if (Array.isArray(live?.history) && live.history.length) setHistory(live.history);
  }), [applyRound]);

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), CLOCK_TICK);
    return () => clearInterval(id);
  }, []);

  // Uyarı ekranda kısa süre kalır, sonra kendiliğinden kaybolur.
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(() => setMessage(''), 2600);
    return () => clearTimeout(id);
  }, [message]);

  const serverNow = serverNowRef.current + (clock - fetchedAtRef.current);
  const phase = phaseAt(round, serverNow);
  const betting = phase === 'betting';
  const stake = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
  // Masaya konan jeton anında bakiyeden düşmüş sayılır: coin gerçek zamanlı azalır.
  // Tur sonuçlandığında sunucunun kesin bakiyesi ekrana yazılır.
  const available = Math.max(0, coins - stake);

  // Jeton masaya konur: blok dokunuşu seçili kademe kadar artırır.
  const placeBet = useCallback((blockId) => {
    if (!betting || busyRef.current) return;
    const total = Object.values(bets).reduce((sum, amount) => sum + amount, 0);
    if (total + chip > coins) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    setMessage('');
    setBets({ ...bets, [blockId]: (bets[blockId] || 0) + chip });
  }, [betting, bets, chip, coins]);

  const clearBets = useCallback(() => {
    if (!betting) return;
    setBets({});
    setMessage('');
  }, [betting]);

  // REPEAT: bir önceki turun bahis düzeni yeniden masaya konur.
  const repeat = useCallback(() => {
    if (!betting || !lastBets) return;
    const total = Object.values(lastBets).reduce((sum, amount) => sum + amount, 0);
    if (total > coins) {
      setMessage('Yetersiz coin. Coin bakiyene dokunup coin yükle.');
      return;
    }
    setBets({ ...lastBets });
    setMessage('');
  }, [betting, coins, lastBets]);

  // Tur dönerken bahis kendiliğinden oynanır: masada bahsi olan herkes aynı numaraya oynar.
  useEffect(() => {
    if (phase !== 'spinning' || !round) return;
    if (firedRef.current === round.round_no) return;
    const placed = Object.entries(betsRef.current).map(([id, amount]) => ({ id, amount }));
    const total = placed.reduce((sum, bet) => sum + bet.amount, 0);
    // Bahsi olmayan oyuncu izler: çark yine de o turun numarasına döner.
    if (!total) return;
    firedRef.current = round.round_no;
    busyRef.current = true;
    rouletteRequests({ action: 'spin', round_no: round.round_no, bets: placed })
      .then((data) => {
        applyWallet(data);
        applyRound(data?.round);
        setResult({ number: data.number, index: data.index, payout: data.payout || 0 });
        setPayout(data.payout || 0);
        setLastBets(betsRef.current);
        setBets({});
        setMessage('');
      })
      .catch((error) => {
        const raw = error?.response?.data?.error;
        setMessage(raw && error?.response?.status !== 429 && !/rate|limit|sınır|yoğun/i.test(raw) ? raw : 'Bağlantı yoğun, bahsin sonraki turda geçerli.');
      })
      .finally(() => { busyRef.current = false; });
  }, [phase, round, applyRound, applyWallet]);

  // Masadaki jetonlar karşı tarafa da görünür: bahis değiştikçe masa yayınlanır.
  const tableRound = round?.round_no || 0;
  const tableSentAt = useRef(0);
  useEffect(() => {
    if (!betting || !tableRound) return undefined;
    const placed = Object.entries(bets).map(([block, amount]) => ({ block, amount }));
    // Hızlı jeton dizilişinde de masa en geç 1,2 saniyede bir yayınlanır.
    const wait = Date.now() - tableSentAt.current > 1200 ? 80 : 350;
    const timer = setTimeout(() => {
      tableSentAt.current = Date.now();
      rouletteRequests({ action: 'table', round_no: tableRound, bets: placed }).catch(() => {});
    }, wait);
    return () => clearTimeout(timer);
  }, [betting, tableRound, bets]);

  // Geri sayım ve şerit ilerlemesi turun sunucu saatinden hesaplanır.
  let countdown = null;
  let progress = 0;
  if (round) {
    const spinning = phase === 'spinning';
    const from = at(spinning ? round.phase_ends_at : round.started_at);
    const to = at(spinning ? round.ends_at : round.phase_ends_at);
    if (from !== null && to !== null) {
      const span = Math.max(1, to - from);
      const left = Math.max(0, to - serverNow);
      countdown = Math.ceil(left / 1000);
      progress = Math.min(1, Math.max(0, (span - left) / span));
    }
  }

  return {
    status,
    coins,
    available,
    totalWon,
    spins,
    chip,
    setChip,
    bets,
    stake,
    lastBets,
    round,
    history,
    phase,
    countdown,
    progress,
    result,
    payout,
    message,
    placeBet,
    clearBets,
    repeat,
  };
}