import { LockKeyhole, RefreshCw, ServerOff, WifiOff } from 'lucide-react';
import type { TraccarError } from '../types/traccar';

interface ErrorStateProps {
  error: TraccarError;
  onRetry: () => void;
  onBack: () => void;
}

const META = {
  network: {
    icon: WifiOff,
    title: 'Sin conexión con Traccar',
    body: 'No pudimos alcanzar el servidor de seguimiento. Puede estar caído, bloqueado por la red o el proxy no está configurado.',
  },
  auth: {
    icon: LockKeyhole,
    title: 'No se pudo iniciar sesión',
    body: 'Las credenciales fueron rechazadas o el servidor solo permite lectura. Verifica el email y la contraseña e inténtalo de nuevo.',
  },
  server: {
    icon: ServerOff,
    title: 'El servidor respondió con un error',
    body: 'Traccar devolvió una respuesta inesperada. El servicio puede estar saturado; reintenta en unos segundos.',
  },
} as const;

export function ErrorState({ error, onRetry, onBack }: ErrorStateProps) {
  const meta = META[error.kind] ?? META.server;
  const Icon = meta.icon;

  return (
    <div className="grid flex-1 place-items-center overflow-y-auto bg-bg px-4 py-10" role="alert" aria-live="assertive">
      <section
        aria-labelledby="error-title"
        className="w-full max-w-[440px] rounded-[8px] border border-danger-border bg-surface p-6 shadow-[var(--shadow-card)]"
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-danger-soft text-danger" aria-hidden="true">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h2 id="error-title" className="text-[16px] font-semibold leading-6 text-text">
              {meta.title}
            </h2>
            <p className="mt-1.5 text-[13px] leading-[18px] text-text-2">{meta.body}</p>
            {error.status !== undefined && (
              <p className="mt-2 font-mono text-[11px] text-text-3">HTTP {error.status}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-on-accent transition-colors hover:bg-primary-hover"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Reintentar
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-[8px] border border-border bg-surface px-4 text-[13px] font-semibold text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
          >
            Cambiar servidor
          </button>
        </div>
      </section>
    </div>
  );
}
