import { Moon, Sun } from 'lucide-react';
import type { Theme } from '../lib/useTheme';

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const nextLabel = theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={nextLabel}
      title={nextLabel}
      className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-border bg-surface px-3 text-[12px] font-medium text-text-2 transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-text"
    >
      {theme === 'light' ? <Moon aria-hidden="true" size={15} /> : <Sun aria-hidden="true" size={15} />}
      <span className="hidden sm:inline">{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
    </button>
  );
}
