import { useEffect, useRef, useState } from 'react';
import { Battery, Clock, Fuel, Gauge, MapPin, Navigation, Signal, Truck } from 'lucide-react';
import { formatCoordinate, formatRelativeTime, formatSpeed, isDeviceOnline, knotsToKmh, readNumericAttribute } from '../lib/format';
import type { TraccarDevice, TraccarPosition } from '../types/traccar';

interface StatusCardProps {
  device: TraccarDevice | null;
  position: TraccarPosition | null;
  now: number;
}

function useFlashKey(value: string | number | null | undefined): boolean {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== undefined && prevRef.current !== null && value !== prevRef.current) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 900);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value]);

  return flash;
}

function Row({ label, children, mono = false }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2.5 last:border-b-0">
      <dt className="label-caps shrink-0">{label}</dt>
      <dd className={`min-w-0 text-right text-[13px] font-medium text-text ${mono ? 'font-mono tnum' : ''}`}>
        {children}
      </dd>
    </div>
  );
}

export function StatusCard({ device, position, now }: StatusCardProps) {
  const speedKey = position ? Math.round(position.speed * 10) : null;
  const flashSpeed = useFlashKey(speedKey);
  const batteryValue = readNumericAttribute(position?.attributes, 'batteryLevel');
  const flashBattery = useFlashKey(batteryValue === null ? null : Math.round(batteryValue));

  const [announcement, setAnnouncement] = useState('');
  const announceRef = useRef<{ id: number | null; online: boolean | null }>({ id: null, online: null });

  useEffect(() => {
    if (!device) {
      setAnnouncement('');
      announceRef.current = { id: null, online: null };
      return;
    }
    const isOnline = isDeviceOnline(device, now);
    const prev = announceRef.current;
    const selectionChanged = prev.id !== device.id;
    const statusChanged = prev.id === device.id && prev.online !== null && prev.online !== isOnline;
    if (selectionChanged) {
      const speedText = position ? `, ${formatSpeed(position.speed)} kilómetros por hora` : '';
      setAnnouncement(`Vehículo ${device.name} seleccionado. ${isOnline ? 'En línea' : 'Sin conexión'}${speedText}.`);
    } else if (statusChanged) {
      setAnnouncement(`${device.name} ahora ${isOnline ? 'en línea' : 'sin conexión'}.`);
    }
    announceRef.current = { id: device.id, online: isOnline };
  }, [device, position, now]);

  const online = device ? isDeviceOnline(device, now) : false;
  const battery = batteryValue;
  const fuel = readNumericAttribute(position?.attributes, 'fuel');
  const ignition = position?.attributes?.['ignition'] === true;
  const speedKmh = position ? knotsToKmh(position.speed) : null;

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      {!device ? (
        <section aria-label="Tarjeta de estado" className="rounded-[8px] border border-border bg-surface p-4">
          <p className="text-[13px] text-text-3">Selecciona un vehículo para ver su estado.</p>
        </section>
      ) : (
        <section
          id="status-card"
          tabIndex={-1}
          aria-labelledby="status-card-title"
          className="flex flex-col rounded-[8px] border border-border bg-surface shadow-[var(--shadow-card)]"
        >
          <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
            <div className="min-w-0">
              <h2 id="status-card-title" className="flex items-center gap-2 text-[15px] font-semibold leading-5 text-text">
                <Truck size={15} aria-hidden="true" className="shrink-0 text-primary" />
                <span className="truncate">{device.name}</span>
              </h2>
              <p className="mt-0.5 font-mono text-[11px] text-text-3">ID {device.uniqueId}</p>
            </div>
            <span
              className={`status-chip inline-flex shrink-0 items-center gap-2 rounded-[4px] border px-2 py-1 text-[11px] font-semibold ${
                online ? 'border-accent-border bg-online-soft text-primary' : 'border-border bg-offline-soft text-text-3'
              }`}
            >
              <span className={online ? 'pulse-dot' : 'pulse-dot pulse-dot--offline'} aria-hidden="true" />
              <span className="sr-only">Estado de conexión: </span>
              {online ? 'En línea' : 'Sin conexión'}
            </span>
          </header>

          <div className="border-b border-border px-4 py-4">
            <p className="label-caps mb-1 flex items-center gap-1.5">
              <Gauge size={12} aria-hidden="true" />
              Velocidad actual
            </p>
            <p
              className={`inline-flex items-baseline gap-1.5 rounded-[4px] px-1 ${flashSpeed ? 'value-flash' : ''}`}
            >
              <span className="font-mono text-[28px] font-semibold leading-8 tracking-[-0.03em] text-text tnum">
                {speedKmh === null ? '—' : formatSpeed(position!.speed)}
              </span>
              <span className="text-[12px] font-medium text-text-3">km/h</span>
            </p>
            {position && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-text-2">
                <Navigation size={12} aria-hidden="true" className="text-text-3" />
                Rumbo {Math.round(position.course)}°
              </p>
            )}
          </div>

          <dl className="px-4 py-1">
            <Row label="Última actualización" mono>
              <span>{position ? formatRelativeTime(position.fixTime, now) : formatRelativeTime(device.lastUpdate, now)}</span>
            </Row>
            <Row label="Ubicación" mono>
              {position ? (
                <span className="flex flex-col items-end gap-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin size={11} aria-hidden="true" className="text-text-3" />
                    {formatCoordinate(position.latitude, 'lat')}
                  </span>
                  <span>{formatCoordinate(position.longitude, 'lon')}</span>
                </span>
              ) : (
                'Sin señal GPS'
              )}
            </Row>
            {position?.address && (
              <Row label="Zona">
                <span className="block max-w-[180px] truncate" title={position.address}>
                  {position.address}
                </span>
              </Row>
            )}
            <Row label="Batería" mono>
              {battery === null ? (
                <span className="text-text-3">—</span>
              ) : (
                <span className={`inline-flex items-center gap-1.5 rounded-[4px] px-1 ${flashBattery ? 'value-flash' : ''}`}>
                  <Battery size={12} aria-hidden="true" className="text-text-3" />
                  {Math.round(battery)}%
                </span>
              )}
            </Row>
            <Row label="Combustible" mono>
              {fuel === null ? (
                <span className="text-text-3">—</span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Fuel size={12} aria-hidden="true" className="text-text-3" />
                  {Math.round(fuel)}%
                </span>
              )}
            </Row>
            <Row label="Motor encendido">
              {position ? (
                <span className="inline-flex items-center gap-1.5">
                  <Signal size={12} aria-hidden="true" className={ignition ? 'text-primary' : 'text-text-3'} />
                  {ignition ? 'Encendida' : 'Apagada'}
                </span>
              ) : (
                <span className="text-text-3">—</span>
              )}
            </Row>
            <Row label="Protocolo" mono>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={12} aria-hidden="true" className="text-text-3" />
                {position?.protocol ?? '—'}
              </span>
            </Row>
          </dl>
        </section>
      )}
    </>
  );
}
