import { Car, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isDeviceOnline } from '../lib/format';
import type { TraccarDevice, TraccarPosition } from '../types/traccar';

interface DeviceListProps {
  devices: TraccarDevice[];
  positionByDevice: Map<number, TraccarPosition>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  now: number;
}

export function DeviceList({ devices, positionByDevice, selectedId, onSelect, now }: DeviceListProps) {
  const [query, setQuery] = useState('');
  const [filterAnnouncement, setFilterAnnouncement] = useState('');

  const filtered = devices.filter((device) => {
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      device.name.toLowerCase().includes(needle) ||
      device.uniqueId.toLowerCase().includes(needle) ||
      String(device.id).includes(needle)
    );
  });

  useEffect(() => {
    if (devices.length === 0) {
      setFilterAnnouncement('');
      return;
    }
    if (query.trim() && filtered.length === 0) {
      setFilterAnnouncement('Ningún vehículo coincide con el filtro.');
    } else {
      setFilterAnnouncement('');
    }
  }, [query, filtered.length, devices.length]);

  const onlineCount = devices.filter((d) => isDeviceOnline(d, now)).length;

  return (
    <aside
      aria-label="Lista de vehículos"
      className="flex w-full shrink-0 flex-col border-b border-border bg-surface lg:h-full lg:w-[280px] lg:border-b-0 lg:border-r"
    >
      <div aria-live="polite" className="sr-only">
        {filterAnnouncement}
      </div>
      <div className="border-b border-border px-3 py-3">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="label-caps">Flota</h2>
          <span className="font-mono text-[11px] text-text-3" aria-live="polite">
            {onlineCount}/{devices.length} en línea
          </span>
        </div>
        <div className="relative">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-3"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar por nombre o ID…"
            aria-label="Filtrar vehículos por nombre o identificador"
            className="h-9 w-full rounded-[8px] border border-border bg-surface-2 pl-8 pr-3 text-[13px] text-text transition-colors placeholder:text-text-3 focus:border-accent"
          />
        </div>
      </div>

      <p id="fleet-list-hint" className="sr-only">
        Selecciona un vehículo para visualizar su información en el panel de la derecha.
      </p>
      {filtered.length === 0 && (
        <p className="px-4 py-8 text-center text-[13px] text-text-3">
          {devices.length === 0 ? 'Sin vehículos en la flota.' : 'Ningún vehículo coincide con el filtro.'}
        </p>
      )}
      <ul
        className="flex-1 overflow-y-auto"
        role="listbox"
        aria-label="Vehículos disponibles"
        aria-describedby="fleet-list-hint"
      >
        {filtered.map((device) => {
          const online = isDeviceOnline(device, now);
          const position = positionByDevice.get(device.id);
          const isSelected = device.id === selectedId;
          return (
            <li key={device.id} role="none">
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(device.id)}
                className={`flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-left transition-colors ${
                  isSelected
                    ? 'border-l-[3px] border-l-accent bg-accent-soft'
                    : 'border-l-[3px] border-l-transparent hover:bg-surface-2'
                }`}
              >
                <Car
                  size={15}
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${online ? 'text-primary' : 'text-text-3'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-semibold leading-[18px] text-text">
                      {device.name}
                    </span>
                    <span
                      className={`status-chip inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-1.5 py-0.5 text-[10px] font-semibold ${
                        online
                          ? 'border-accent-border bg-online-soft text-primary'
                          : 'border-border bg-offline-soft text-text-3'
                      }`}
                    >
                      <span
                        className={online ? 'pulse-dot scale-75' : 'pulse-dot pulse-dot--offline scale-75'}
                        aria-hidden="true"
                      />
                      {online ? 'En línea' : 'Sin conexión'}
                    </span>
                  </span>
                  <span className="mt-0.5 flex items-center justify-between gap-2 font-mono text-[11px] text-text-3">
                    <span className="truncate">#{device.uniqueId}</span>
                    {position && (
                      <span className="tnum shrink-0 text-text-2">{Math.round(position.speed * 1.852)} km/h</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
