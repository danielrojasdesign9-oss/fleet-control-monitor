import { Activity, Database } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { Theme } from '../lib/useTheme';

interface HeaderProps {
  theme: Theme;
  onToggleTheme: () => void;
  isLive: boolean;
  sourceLabel: string;
}

export function Header({ theme, onToggleTheme, isLive, sourceLabel }: HeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-primary text-on-accent"
          aria-hidden="true"
        >
          <Activity size={16} strokeWidth={2.25} />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-semibold leading-5 tracking-[-0.01em] text-text">
            Fleet Control
          </h1>
          <p className="label-caps truncate">Monitor de vehículo en tiempo real</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className={`hidden items-center gap-2 rounded-[8px] border px-2.5 py-1.5 text-[12px] font-medium sm:inline-flex ${
            isLive
              ? 'border-accent-border bg-accent-soft text-primary'
              : 'border-border bg-surface-2 text-text-3'
          }`}
        >
          <span
            className={isLive ? 'pulse-dot' : 'pulse-dot pulse-dot--offline'}
            aria-hidden="true"
          />
          {isLive ? 'En vivo' : 'En espera'}
        </span>
        <span
          className="hidden items-center gap-1.5 rounded-[8px] border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-[11px] text-text-2 md:inline-flex"
          title="Fuente de datos Traccar"
        >
          <Database size={13} aria-hidden="true" />
          {sourceLabel}
        </span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}
