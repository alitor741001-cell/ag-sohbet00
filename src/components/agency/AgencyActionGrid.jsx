import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AgencyActionGrid({ actions, onTransfer, onCreate }) {
  const style = 'group flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-secondary/50 p-3 text-left text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-primary/10';
  return (
    <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {actions.map(action => {
        const content = <><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><action.icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 break-words text-xs font-semibold">{action.label}</span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /></>;
        return action.path && action.key !== 'transferler'
          ? <Link key={action.key} to={action.path} className={style}>{content}</Link>
          : <button key={action.key} type="button" onClick={action.key === 'transferler' ? onTransfer : onCreate} className={style}>{content}</button>;
      })}
    </div>
  );
}