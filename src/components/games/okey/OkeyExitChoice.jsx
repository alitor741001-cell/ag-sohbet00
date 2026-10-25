import useBackDismiss from '@/hooks/useBackDismiss';

export default function OkeyExitChoice({ busy, error, onBack, onLeave, onCancel }) {
  useBackDismiss(true, onCancel);
  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center bg-background/80 p-5" role="dialog" aria-modal="true" aria-labelledby="okey-exit-title">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-xl">
        <h2 id="okey-exit-title" className="text-lg font-bold">Oyundan çıkış</h2>
        <p className="mt-2 text-sm text-muted-foreground">Geri dönersen masadaki yerin korunur. Oyundan ayrılırsan masadan çıkarsın.</p>
        {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
        <div className="mt-4 flex flex-col gap-2">
          <button type="button" disabled={busy} onClick={onLeave} className="rounded-xl bg-destructive p-3 font-semibold text-destructive-foreground">{busy ? 'Ayrılınıyor...' : 'Oyundan ayrıl'}</button>
          <button type="button" disabled={busy} onClick={onBack} className="rounded-xl bg-secondary p-3 font-semibold text-secondary-foreground">Geri dön</button>
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl p-3 text-muted-foreground">Oyuna devam et</button>
        </div>
      </div>
    </div>
  );
}