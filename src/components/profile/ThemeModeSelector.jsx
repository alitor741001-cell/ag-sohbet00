import { useState } from 'react';
import { Check, ChevronDown, SunMoon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { getThemeMode, setThemeMode } from '@/lib/themeMode';

const MODES = [
  { value: 'system', label: 'Cihaz teması', note: 'Cihazın açık/koyu tercihi izlenir.' },
  { value: 'light', label: 'Açık tema', note: 'Uygulama her zaman açık görünür.' },
  { value: 'dark', label: 'Koyu tema', note: 'Uygulama her zaman koyu görünür.' },
];

/**
 * Görünüm tercihi: sistem, açık veya koyu. Seçim cihazda saklanır, tema anında uygulanır
 * ve tarayıcı çubuğunun rengi (theme-color) seçilen temaya göre güncellenir.
 */
export default function ThemeModeSelector() {
  const { toast } = useToast();
  const [mode, setMode] = useState(() => getThemeMode());
  const current = MODES.find((item) => item.value === mode) || MODES[0];

  const choose = (item) => {
    setMode(setThemeMode(item.value));
    toast({ title: `${item.label} seçildi`, description: item.note });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <SunMoon className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Görünüm</p>
          <p className="text-xs text-muted-foreground">Tema tercihi bu cihazda saklanır.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-ring">
            {current.label}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {MODES.map((item) => (
              <DropdownMenuItem key={item.value} onSelect={() => choose(item)} className="justify-between font-semibold">
                {item.label}
                {mode === item.value && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  );
}