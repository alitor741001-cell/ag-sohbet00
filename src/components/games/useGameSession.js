import { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';

const friendlyError = (error) => error?.response?.data?.error || error?.message || 'İşlem başarısız';

/** Oyun Merkezi oturumu: bakiye, ayarlar, geçmiş ve tüm sunucu çağrıları. */
export default function useGameSession(open) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [config, setConfig] = useState(null);
  const [symbols, setSymbols] = useState([]);
  const [levelInfo, setLevelInfo] = useState(null);
  const [betCap, setBetCap] = useState(0);
  const [jackpotMinBet, setJackpotMinBet] = useState(1000);
  const [history, setHistory] = useState([]);
  const loadedRef = useRef(false);

  const apply = useCallback((data) => {
    if (!data) return;
    if (data.profile) setProfile(data.profile);
    if (data.config) setConfig(data.config);
    if (data.symbols) setSymbols(data.symbols);
    if (data.level_info) setLevelInfo(data.level_info);
    if (typeof data.bet_cap === 'number') setBetCap(data.bet_cap);
    if (typeof data.jackpot_min_bet === 'number') setJackpotMinBet(data.jackpot_min_bet);
    if (Array.isArray(data.history) && data.history.length >= 0) setHistory(data.history);
  }, []);

  const call = useCallback(async (payload) => {
    try {
      const response = await base44.functions.invoke('game-service', payload);
      apply(response.data);
      return response.data;
    } catch (error) {
      const message = friendlyError(error);
      toast({ title: 'Oyun', description: message, variant: 'destructive' });
      return { error: message };
    }
  }, [apply, toast]);

  const refreshHistory = useCallback(async () => {
    const data = await call({ action: 'get' });
    return data;
  }, [call]);

  useEffect(() => {
    if (!open || loadedRef.current) return;
    loadedRef.current = true;
    setLoading(true);
    call({ action: 'get' }).finally(() => setLoading(false));
  }, [open, call]);

  // Jackpot havuzları canlı güncellenir.
  useEffect(() => {
    if (!open) return undefined;
    const unsubscribe = base44.entities.GameConfig.subscribe((event) => {
      if (event?.data) setConfig((prev) => ({ ...(prev || {}), ...event.data }));
    });
    return unsubscribe;
  }, [open]);

  return {
    loading,
    profile,
    config,
    symbols,
    levelInfo,
    betCap,
    jackpotMinBet,
    history,
    call,
    apply,
    refreshHistory,
    toast,
  };
}