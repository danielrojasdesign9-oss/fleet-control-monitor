import { useEffect, useMemo, useState } from 'react';
import { Activity, Beaker, ChevronDown, Signal, SignalZero, WifiOff } from 'lucide-react';
import { StatusCard } from '../components/StatusCard';
import { DeviceListSkeleton, MapSkeleton, StatusCardSkeleton } from '../components/Skeleton';
import { ErrorState } from '../components/ErrorState';
import { TraccarError, type TraccarDevice, type TraccarPosition } from '../types/traccar';
import {
  setQaFault,
  setQaForceLoading,
  setQaHighContrastMap,
  useQaState,
  type QaFault,
} from './flags';

const FAULTS: { id: QaFault; label: string; Icon: typeof WifiOff }[] = [
  { id: 'none', label: 'Normal', Icon: Activity },
  { id: 'network', label: 'Sin red', Icon: WifiOff },
  { id: 'auth', label: 'Auth 401', Icon: SignalZero },
  { id: 'server', label: 'Servidor 5xx', Icon: Signal },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-3 py-3 last:border-b-0">
      <h3 className="label-caps mb-2">{title}</h3>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="text-[12px] font-medium text-text-2">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-accent-border bg-primary' : 'border-border bg-surface-2'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-surface shadow transition-all ${
            checked ? 'left-[18px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  );
}

/**
 * Demo en vivo de la tarjeta: velocidad/batería simuladas para observar
 * el flash, y un toggle Online/Offline para el estado sin conexión.
 */
function DemoStatusCard() {
  const [tick, setTick] = useState(0);
  const [demoOnline, setDemoOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      setNow(Date.now());
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  const device: TraccarDevice = useMemo(
    () => ({
      id: 0,
      name: 'Vehículo demo QA',
      uniqueId: 'qa-demo-001',
      status: demoOnline ? 'online' : 'offline',
      lastUpdate: demoOnline ? new Date(now).toISOString() : new Date(now - 20 * 60 * 1000).toISOString(),
    }),
    [demoOnline, now],
  );

  const position: TraccarPosition | null = useMemo(() => {
    if (!demoOnline) {
      return {
        id: 1,
        deviceId: 0,
        protocol: 'osmand',
        serverTime: new Date(now - 20 * 60 * 1000).toISOString(),
        deviceTime: new Date(now - 20 * 60 * 1000).toISOString(),
        fixTime: new Date(now - 20 * 60 * 1000).toISOString(),
        valid: true,
        outdated: true,
        latitude: 51.5074,
        longitude: -0.1278,
        speed: 0,
        course: 0,
        attributes: { batteryLevel: 41, ignition: false, fuel: 55 },
      };
    }
    const wobble = Math.sin(tick / 3) * 18 + 48;
    return {
      id: 1,
      deviceId: 0,
      protocol: 'osmand',
      serverTime: new Date(now).toISOString(),
      deviceTime: new Date(now).toISOString(),
      fixTime: new Date(now).toISOString(),
      valid: true,
      outdated: false,
      latitude: 51.5074 + tick * 0.0004,
      longitude: -0.1278 + tick * 0.0006,
      speed: Math.max(0, wobble) / 1.852,
      course: (tick * 12) % 360,
      attributes: { batteryLevel: Math.max(12, 87 - tick * 1.4), ignition: true, fuel: 62 },
    };
  }, [demoOnline, tick, now]);

  return (
    <div className="space-y-2">
      <ToggleRow label="Estado del vehículo (Online/Offline)" checked={demoOnline} onChange={setDemoOnline} />
      <p className="text-[11px] leading-4 text-text-3">
        Cada 2.4 s cambian velocidad y batería: observa el fundido (flash) en ambos valores. Al pasar a
        Offline, el badge se vuelve gris sin pulso y los datos se congelan.
      </p>
      <StatusCard device={device} position={position} now={now} />
    </div>
  );
}

function DemoSkeletons() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-4 text-text-3">
        Tres placeholders con el mismo tamaño final que el contenido real: cero CLS, shimmer sutil.
      </p>
      <StatusCardSkeleton />
      <MapSkeleton />
      <div className="rounded-[8px] border border-border bg-surface">
        <DeviceListSkeleton />
      </div>
    </div>
  );
}

function DemoError() {
  const [kind, setKind] = useState<'network' | 'auth' | 'server'>('network');
  const error = useMemo(() => {
    switch (kind) {
      case 'auth':
        return new TraccarError('Las credenciales fueron rechazadas.', 'auth', 401);
      case 'server':
        return new TraccarError('El servidor devolvió 503.', 'server', 503);
      default:
        return new TraccarError('No se pudo alcanzar el servidor.', 'network');
    }
  }, [kind]);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {(['network', 'auth', 'server'] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={`h-7 rounded-[4px] border px-2 text-[11px] font-semibold transition-colors ${
              kind === k ? 'border-accent-border bg-accent-soft text-primary' : 'border-border bg-surface text-text-2'
            }`}
          >
            {k === 'network' ? 'Red' : k === 'auth' ? 'Auth' : 'Servidor'}
          </button>
        ))}
      </div>
      <ErrorState error={error} onRetry={() => {}} onBack={() => {}} />
    </div>
  );
}

export function QaLab() {
  const qa = useQaState();
  const [open, setOpen] = useState(true);
  const [demo, setDemo] = useState<'card' | 'skeletons' | 'error' | null>('card');

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[900] flex w-[340px] flex-col items-end gap-2">
      <div className="pointer-events-auto w-full overflow-hidden rounded-[8px] border border-border bg-surface shadow-[var(--shadow-float)]">
        <header className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 className="flex items-center gap-2 text-[12px] font-semibold text-text">
            <Beaker size={14} aria-hidden="true" className="text-primary" />
            Laboratorio QA
          </h2>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Contraer laboratorio QA' : 'Expandir laboratorio QA'}
            onClick={() => setOpen((o) => !o)}
            className="grid h-7 w-7 place-items-center rounded-[4px] text-text-2 transition-colors hover:bg-surface-2"
          >
            <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? '' : 'rotate-180'}`} />
          </button>
        </header>

        {open && (
          <div className="max-h-[70vh] overflow-y-auto">
            <Section title="Inyectar fallo de red (afecta la app real)">
              <div className="grid grid-cols-2 gap-1.5">
                {FAULTS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={qa.fault === id}
                    onClick={() => setQaFault(id)}
                    className={`flex h-8 items-center justify-center gap-1.5 rounded-[4px] border text-[11px] font-semibold transition-colors ${
                      qa.fault === id
                        ? 'border-accent-border bg-accent-soft text-primary'
                        : 'border-border bg-surface text-text-2 hover:bg-surface-2'
                    }`}
                  >
                    <Icon size={12} aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Estados de la interfaz">
              <ToggleRow
                label="Sostener estado de carga (skeletons)"
                checked={qa.forceLoading}
                onChange={setQaForceLoading}
              />
              <ToggleRow
                label="Mapa de alto contraste"
                checked={qa.highContrastMap}
                onChange={setQaHighContrastMap}
              />
            </Section>

            <Section title="Demos de micro-interacciones">
              <div className="mb-2 flex gap-1.5">
                {([
                  ['card', 'Tarjeta viva'],
                  ['skeletons', 'Skeletons'],
                  ['error', 'Errores'],
                ] as const).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={demo === id}
                    onClick={() => setDemo(demo === id ? null : id)}
                    className={`h-7 rounded-[4px] border px-2 text-[11px] font-semibold transition-colors ${
                      demo === id
                        ? 'border-accent-border bg-accent-soft text-primary'
                        : 'border-border bg-surface text-text-2 hover:bg-surface-2'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {demo === 'card' && <DemoStatusCard />}
              {demo === 'skeletons' && <DemoSkeletons />}
              {demo === 'error' && <DemoError />}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
