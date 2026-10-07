import { Check, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { statusLabel, STATUS_COLORS } from '@/lib/supportStatus';

// Talep durumları: etiketler ve renkler destek panelinin geri kalanıyla aynı kaynaktan gelir.
const STATUSES = ['new', 'reviewing', 'answered', 'closed'];

/**
 * Destek talebi durum seçimi: native <select> yerine uygulama temasına uygun
 * özel tasarımlı açılır seçim. Seçili durum onay işaretiyle işaretlenir.
 */
export default function SupportStatusSelect({ value, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Talep durumu"
          className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 py-1.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={`h-2 w-2 shrink-0 rounded-full bg-current ${STATUS_COLORS[value] || 'text-muted-foreground'}`} />
          <span>{statusLabel(value)}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[9.5rem] rounded-xl border border-premium-gold/30 bg-anthracite-raised p-1 shadow-2xl"
      >
        {STATUSES.map((status) => (
          <DropdownMenuItem
            key={status}
            onSelect={() => onChange(status)}
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-white/85 outline-none focus:bg-premium-gold/15 focus:text-white"
          >
            <span className={`h-2 w-2 shrink-0 rounded-full bg-current ${STATUS_COLORS[status] || 'text-muted-foreground'}`} />
            <span className="flex-1">{statusLabel(status)}</span>
            {value === status && <Check className="h-3.5 w-3.5 text-premium-gold" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}