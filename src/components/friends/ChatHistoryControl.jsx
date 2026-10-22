export default function ChatHistoryControl({ loading, loadingOlder, hasOlder, error, onLoad, onRetry }) {
  if (loading || (!hasOlder && !error)) return null;
  return (
    <div className="space-y-2 text-center">
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      <button type="button" disabled={loadingOlder} onClick={error ? onRetry : onLoad}
        className="min-h-11 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-medium text-foreground disabled:opacity-60"
        aria-busy={loadingOlder}>
        {loadingOlder ? 'Önceki mesajlar yükleniyor...' : error ? 'Tekrar dene' : 'Önceki mesajları yükle'}
      </button>
    </div>
  );
}