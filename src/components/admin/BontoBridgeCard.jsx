import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Radar, RefreshCw, CheckCircle2, XCircle, Lock, Unlock } from 'lucide-react';

/** Bonto'daki modül bayraklarının okunabilir adları (iki sunucu sürümünün adları da karşılanır). */
const MODUL_ADLARI = {
  liveRooms: 'Sesli odalar',
  liveMessages: 'Mesajlar',
  messages: 'Mesajlar',
  shadowRead: 'Gölge okuma',
  gifts: 'Hediyeler',
  coins: 'Jeton / bakiye',
  games: 'Oyunlar',
};

/**
 * Bonto köprüsü durumu.
 * Yalnızca okuma yapar: canlı sunucunun hazır olup olmadığını ve hangi modüllerin
 * açık/kapalı olduğunu gösterir. Hiçbir kullanıcı akışını Bonto'ya yönlendirmez.
 */
export default function BontoBridgeCard() {
  const [durum, setDurum] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const kontrol = async () => {
    setYukleniyor(true);
    const res = await base44.functions.invoke('bontoTest', {}).catch(() => null);
    const veri = res?.data || null;
    setDurum({
      veri,
      zaman: new Date().toLocaleTimeString('tr-TR'),
      hata: veri ? '' : 'Bonto sunucusuna ulaşılamadı.',
    });
    setYukleniyor(false);
  };

  useEffect(() => { kontrol(); }, []);

  const tests = durum?.veri?.tests || [];
  const hazirlik = tests.find((test) => String(test.ad || '').includes('health/ready'));
  const bayraklar = hazirlik?.yanit?.features || null;
  const erisilebilir = Boolean(hazirlik?.basarili);
  const kart = 'bg-card border border-border rounded-xl p-5 space-y-3';

  return (
    <div className={kart}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/15 text-primary"><Radar className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold">Bonto Köprüsü</h3>
            <p className="text-sm text-muted-foreground">
              Canlı sunucu (ag-sohbet.bonto.run) hazırlık durumu. Geçiş kapalı: kullanıcı akışları
              Base44'te çalışmaya devam eder.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={kontrol}
          disabled={yukleniyor}
          className="p-2 rounded-lg border border-border hover:border-primary/60 transition-colors disabled:opacity-50"
          title="Yenile"
        >
          <RefreshCw className={`w-4 h-4 ${yukleniyor ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        {erisilebilir
          ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Sunucu erişilebilir, API hazır</span></>
          : <><XCircle className="w-4 h-4 text-destructive" /><span>{durum?.hata || 'Sunucu hazır değil'}</span></>}
        {durum?.zaman && <span className="ml-auto text-xs text-muted-foreground">Son kontrol: {durum.zaman}</span>}
      </div>

      {tests.length > 0 && (
        <div className="rounded-lg border border-border divide-y divide-border text-xs">
          {tests.map((test) => (
            <div key={test.ad} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="font-mono">{test.ad}</span>
              <span className={test.basarili ? 'text-emerald-500' : 'text-destructive'}>
                {test.basarili ? `OK (${test.durum})` : (test.hata || `Hata (${test.durum})`)}
              </span>
            </div>
          ))}
        </div>
      )}

      {bayraklar && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">Bonto'daki modül durumu</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.keys(bayraklar).filter((anahtar) => anahtar !== 'ignoredFlagRequests').map((anahtar) => {
              const acik = Boolean(bayraklar[anahtar]);
              const ad = MODUL_ADLARI[anahtar] || anahtar;
              return (
                <div key={anahtar} className="flex items-center gap-1.5">
                  {acik
                    ? <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                    : <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className={acik ? '' : 'text-muted-foreground'}>{ad}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Bütün modüller Bonto'da kapatılana kadar geçiş açılmaz. Sıra: kimlik → bakiye/hediye →
        mesajlar → sesli oda durumu → admin → oyunlar → ödeme/ajans.
      </p>
    </div>
  );
}