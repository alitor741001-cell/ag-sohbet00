import { Check, Copy } from 'lucide-react';

export default function ProfileMemberId({ memberId, copied, onCopyId }) {
  return (
    <button type="button" onClick={onCopyId} disabled={!memberId} aria-label="Kimlik numarasını kopyala"
      className="mx-auto mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-fantasy-gold/40 bg-fantasy-gold/10 px-3 py-1 text-[11px] font-bold text-fantasy-text disabled:opacity-50">
      <span className="font-mono">Kimlik: #{memberId || '—'}</span>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}