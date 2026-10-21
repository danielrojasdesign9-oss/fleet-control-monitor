/** Traccar reporta speed en nudos (knots). 1 nudо = 1.852 km/h. */
export const KNOTS_TO_KMH = 1.852;

export function knotsToKmh(knots: number): number {
  return knots * KNOTS_TO_KMH;
}

export function formatSpeed(knots: number): string {
  const kmh = knotsToKmh(knots);
  if (kmh <= 0.5) return '0';
  if (kmh < 10) return kmh.toFixed(1);
  return Math.round(kmh).toString();
}

export function formatCoordinate(value: number, axis: 'lat' | 'lon'): string {
  const hemisphere = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(5)}° ${hemisphere}`;
}

export function formatClock(date: Date): string {
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatRelativeTime(iso: string | null | undefined, now: number): string {
  if (!iso) return 'Sin datos';
  const timestamp = Date.parse(iso);
  if (Number.isNaN(timestamp)) return 'Sin datos';

  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 5) return 'Hace un instante';
  if (seconds < 60) return `Hace ${seconds} segundos`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;

  return formatClock(new Date(timestamp));
}

export function isDeviceOnline(device: { status?: string; lastUpdate?: string | null }, now: number): boolean {
  if (device.status === 'online') return true;
  if (device.status === 'offline' || device.status === 'unknown') {
    if (!device.lastUpdate) return device.status !== 'offline';
  }
  if (device.lastUpdate) {
    const age = now - Date.parse(device.lastUpdate);
    if (!Number.isNaN(age) && age < 5 * 60 * 1000) return true;
  }
  return device.status === 'online';
}

export function readNumericAttribute(
  attributes: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const raw = attributes?.[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}
