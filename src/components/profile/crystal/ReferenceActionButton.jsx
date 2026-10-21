import { Loader2 } from 'lucide-react';

export default function ReferenceActionButton({ icon: Icon, label, onClick, loading = false, active = false }) {
  return <button type="button" className="reference-action" onClick={onClick} disabled={loading} aria-pressed={active}>
    <span className="reference-action-frame"><span className="reference-action-glass">{loading ? <Loader2 className="animate-spin" /> : <Icon />}</span></span>
    <span className="reference-action-label">{label}</span>
  </button>;
}