import { useState } from 'react';
import { ChevronRight, Loader2, LockKeyhole, Radio, ServerCog } from 'lucide-react';
import { TraccarError } from '../lib/traccar';

export interface ConnectResult {
  mode: 'simulator' | 'server';
  baseUrl?: string;
  email?: string;
  password?: string;
}

interface LoginViewProps {
  onConnect: (options: ConnectResult) => Promise<void>;
}

export function LoginView({ onConnect }: LoginViewProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('https://demo4.traccar.org');
  const [busy, setBusy] = useState<'simulator' | 'server' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSimulator() {
    setBusy('simulator');
    setError(null);
    try {
      await onConnect({ mode: 'simulator' });
    } catch (err) {
      setError(err instanceof TraccarError ? err.message : 'No se pudo iniciar la sesión de demostración.');
    } finally {
      setBusy(null);
    }
  }

  async function handleServer(event: React.FormEvent) {
    event.preventDefault();
    setBusy('server');
    setError(null);
    try {
      await onConnect({ mode: 'server', baseUrl: serverUrl.trim(), email: email.trim(), password });
    } catch (err) {
      setError(err instanceof TraccarError ? err.message : 'No se pudo iniciar sesión en el servidor.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid flex-1 place-items-center overflow-y-auto bg-bg px-4 py-10">
      <section
        aria-labelledby="login-title"
        className="w-full max-w-[420px] rounded-[8px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
      >
        <div className="mb-5 flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[8px] bg-primary text-on-accent"
            aria-hidden="true"
          >
            <Radio size={18} />
          </div>
          <div>
            <h2 id="login-title" className="text-[18px] font-semibold leading-6 tracking-[-0.015em] text-text">
              Conectar con Traccar
            </h2>
            <p className="mt-1 text-[13px] leading-[18px] text-text-2">
              Accede a la flota del simulador oficial con datos en vivo o inicia sesión en tu servidor.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-[8px] border border-danger-border bg-danger-soft px-3 py-2.5 text-[13px] text-danger"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleSimulator}
          disabled={busy !== null}
          className="flex w-full items-center justify-between rounded-[8px] bg-primary px-4 py-3 text-left text-[14px] font-semibold text-on-accent transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            {busy === 'simulator' ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Radio size={16} aria-hidden="true" />
            )}
            Usar simulador oficial (datos en vivo)
          </span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <p className="mt-2 text-[12px] leading-4 text-text-3">
          simulator.traccar.org — flota simulada de Londres, sin credenciales, ideal para evaluar la experiencia.
        </p>

        <div className="my-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-border" />
          <span className="label-caps">o tu servidor</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          aria-controls="server-login-form"
          className="flex w-full items-center gap-2 rounded-[8px] border border-border bg-surface-2 px-3 py-2.5 text-[13px] font-medium text-text-2 transition-colors hover:border-border-strong hover:text-text"
        >
          <ServerCog size={15} aria-hidden="true" />
          Iniciar sesión con email y contraseña
          <ChevronRight
            size={14}
            aria-hidden="true"
            className={`ml-auto transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          />
        </button>

        {showAdvanced && (
          <form id="server-login-form" onSubmit={handleServer} className="mt-4 space-y-3">
            <label className="block">
              <span className="label-caps mb-1.5 block">URL del servidor</span>
              <input
                type="url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                required
                autoComplete="url"
                className="h-9 w-full rounded-[8px] border border-border bg-surface px-3 font-mono text-[12px] text-text transition-colors focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label-caps mb-1.5 block">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                autoComplete="username"
                className="h-9 w-full rounded-[8px] border border-border bg-surface px-3 text-[13px] text-text transition-colors focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label-caps mb-1.5 block">Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="h-9 w-full rounded-[8px] border border-border bg-surface px-3 text-[13px] text-text transition-colors focus:border-accent"
              />
            </label>
            <button
              type="submit"
              disabled={busy !== null}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-border bg-surface text-[13px] font-semibold text-text transition-colors hover:bg-surface-2 disabled:opacity-60"
            >
              {busy === 'server' ? (
                <Loader2 size={15} className="animate-spin" aria-hidden="true" />
              ) : (
                <LockKeyhole size={15} aria-hidden="true" />
              )}
              Conectar
            </button>
          </form>
        )}

        <p className="mt-5 border-t border-border pt-4 text-[12px] leading-4 text-text-3">
          Traccar retiró las credenciales demo compartidas. El simulador oficial expone la API en modo lectura;
          para un servidor propio usa POST <code className="font-mono text-[11px]">/api/session</code>.
        </p>
      </section>
    </main>
  );
}
