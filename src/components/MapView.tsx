import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, Mountain, Satellite } from 'lucide-react';
import { isDeviceOnline } from '../lib/format';
import type { TraccarDevice, TraccarPosition } from '../types/traccar';

const EASE_MS = 1600;

type MapStyle = 'streets' | 'terrain' | 'satellite';

const TILE_CONFIG: Record<MapStyle, { url: string; attribution: string; maxZoom: number }> = {
  streets: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | Map style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
};

const MAP_STYLES: { id: MapStyle; label: string; Icon: typeof MapIcon }[] = [
  { id: 'streets', label: 'Calles', Icon: MapIcon },
  { id: 'terrain', label: 'Relieve', Icon: Mountain },
  { id: 'satellite', label: 'Satélite', Icon: Satellite },
];

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function buildMarkerIcon(course: number, online: boolean): L.DivIcon {
  return L.divIcon({
    className: `vehicle-marker${online ? '' : ' vehicle-marker--offline'}`,
    html: `
      <div class="vehicle-marker__wrap">
        <div class="vehicle-marker__pulse"></div>
        <div class="vehicle-marker__body">
          <div class="vehicle-marker__arrow" data-arrow style="transform: rotate(${course}deg)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5 19.5 21 12 16.8 4.5 21z"/>
            </svg>
          </div>
        </div>
      </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function buildFleetDotIcon(online: boolean): L.DivIcon {
  return L.divIcon({
    className: `fleet-dot${online ? '' : ' fleet-dot--offline'}`,
    html: '<span class="fleet-dot__body"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

interface MapViewProps {
  position: TraccarPosition | null;
  online: boolean;
  theme: 'light' | 'dark';
  vehicleLabel: string;
  loading?: boolean;
  devices: TraccarDevice[];
  positionByDevice: Map<number, TraccarPosition>;
  selectedId: number | null;
  onSelect: (id: number) => void;
  now: number;
  highContrast?: boolean;
}

export function MapView({
  position,
  online,
  theme,
  vehicleLabel,
  loading = false,
  devices,
  positionByDevice,
  selectedId,
  onSelect,
  now,
  highContrast = false,
}: MapViewProps) {
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
  const othersRef = useRef<Map<number, L.Marker>>(new Map());
  const onlineByIdRef = useRef<Map<number, boolean>>(new Map());
  const prevLabelRef = useRef<string | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const animRef = useRef<number | null>(null);
  const fromRef = useRef<{ lat: number; lng: number } | null>(null);
  const toRef = useRef<{ lat: number; lng: number } | null>(null);
  const startRef = useRef(0);
  const hasCenteredRef = useRef(false);
  const prevOnlineRef = useRef(online);
  const prevCourseRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
    }).setView([51.5074, -0.1278], 13);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tilesRef.current) {
      map.removeLayer(tilesRef.current);
      tilesRef.current = null;
    }

    const config = TILE_CONFIG[mapStyle];
    tilesRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom,
    }).addTo(map);
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!position) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
        prevCourseRef.current = null;
      }
      return;
    }

    const target = { lat: position.latitude, lng: position.longitude };
    const course = position.course;

    if (!markerRef.current) {
      markerRef.current = L.marker([target.lat, target.lng], {
        icon: buildMarkerIcon(course, online),
        keyboard: false,
        title: vehicleLabel,
        alt: `Ubicación de ${vehicleLabel}`,
      }).addTo(map);
      fromRef.current = { ...target };
      hasCenteredRef.current = true;
      map.setView([target.lat, target.lng], map.getZoom() < 12 ? 14 : map.getZoom(), { animate: false });
      prevCourseRef.current = course;
      prevOnlineRef.current = online;
      prevLabelRef.current = vehicleLabel;
      return;
    }

    const marker = markerRef.current;
    const element = marker.getElement();
    const arrow = element?.querySelector<HTMLElement>('[data-arrow]');

    if (prevLabelRef.current !== vehicleLabel) {
      if (element) {
        (element as HTMLElement).title = vehicleLabel;
        element.setAttribute('aria-label', `Ubicación de ${vehicleLabel}`);
      }
      prevLabelRef.current = vehicleLabel;
    }

    if (prevOnlineRef.current !== online || prevCourseRef.current === null) {
      marker.setIcon(buildMarkerIcon(course, online));
      prevOnlineRef.current = online;
      prevCourseRef.current = course;
    } else if (arrow && prevCourseRef.current !== course) {
      arrow.style.transform = `rotate(${course}deg)`;
      prevCourseRef.current = course;
    }

    if (!hasCenteredRef.current) {
      map.setView([target.lat, target.lng], 14, { animate: true });
      hasCenteredRef.current = true;
    } else {
      map.panTo([target.lat, target.lng], { animate: true, duration: 0.6 });
    }

    const current = marker.getLatLng();
    fromRef.current = { lat: current.lat, lng: current.lng };
    toRef.current = target;

    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    if (prefersReducedMotion()) {
      marker.setLatLng([target.lat, target.lng]);
      return;
    }

    startRef.current = performance.now();

    const step = (nowTs: number) => {
      const from = fromRef.current;
      const to = toRef.current;
      if (!from || !to || !markerRef.current) {
        animRef.current = null;
        return;
      }
      const t = Math.min(1, (nowTs - startRef.current) / EASE_MS);
      const k = easeOutCubic(t);
      const lat = from.lat + (to.lat - from.lat) * k;
      const lng = from.lng + (to.lng - from.lng) * k;
      markerRef.current.setLatLng([lat, lng]);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(step);
  }, [position, online, vehicleLabel]);

  useEffect(() => {
    if (position) return;
    hasCenteredRef.current = false;
  }, [position]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const seen = new Set<number>();

    for (const device of devices) {
      if (device.id === selectedId) continue;
      const pos = positionByDevice.get(device.id);
      if (!pos) continue;
      seen.add(device.id);

      const deviceOnline = isDeviceOnline(device, now);
      const existing = othersRef.current.get(device.id);

      if (existing) {
        existing.setLatLng([pos.latitude, pos.longitude]);
        if (onlineByIdRef.current.get(device.id) !== deviceOnline) {
          existing.setIcon(buildFleetDotIcon(deviceOnline));
          onlineByIdRef.current.set(device.id, deviceOnline);
        }
      } else {
        const marker = L.marker([pos.latitude, pos.longitude], {
          icon: buildFleetDotIcon(deviceOnline),
          title: device.name,
          alt: `Vehículo ${device.name} — seleccionar`,
          keyboard: true,
          zIndexOffset: -500,
        }).addTo(map);
        marker.on('click', () => onSelect(device.id));
        othersRef.current.set(device.id, marker);
        onlineByIdRef.current.set(device.id, deviceOnline);
      }
    }

    for (const [id, marker] of Array.from(othersRef.current.entries())) {
      if (!seen.has(id)) {
        map.removeLayer(marker);
        othersRef.current.delete(id);
      }
    }
  }, [devices, positionByDevice, selectedId, now, onSelect]);

  return (
    <div
      className={`relative h-full min-h-[280px] w-full overflow-hidden rounded-[8px] border border-border bg-surface-2${
        mapStyle === 'satellite' ? ' map-view--satellite' : ''
      }${highContrast ? ' map-view--high-contrast' : ''}`}
    >
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={`Mapa en vivo — ${vehicleLabel}`} />
      {mapStyle === 'satellite' && theme === 'dark' && (
        <div className="pointer-events-none absolute inset-0 z-[450] bg-[#0a1424]/30" aria-hidden="true" />
      )}
      <div
        role="group"
        aria-label="Estilo del mapa"
        className="absolute right-3 top-3 z-[500] flex rounded-[8px] border border-border bg-surface/95 p-0.5 shadow-[var(--shadow-card)]"
      >
        {MAP_STYLES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={mapStyle === id}
            onClick={() => setMapStyle(id)}
            className={`flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[12px] font-semibold transition-colors ${
              mapStyle === id ? 'bg-primary text-on-accent' : 'text-text-2 hover:bg-surface-2'
            }`}
          >
            <Icon size={14} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {loading && (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-[8px] border border-border bg-surface/95 px-2.5 py-1.5 text-[11px] font-semibold text-text-2 shadow-[var(--shadow-card)]">
          Cargando mapa…
        </div>
      )}
    </div>
  );
}
