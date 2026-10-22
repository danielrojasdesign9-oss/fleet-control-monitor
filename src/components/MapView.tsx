import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TraccarPosition } from '../types/traccar';

const EASE_MS = 1600;

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

interface MapViewProps {
  position: TraccarPosition | null;
  online: boolean;
  theme: 'light' | 'dark';
  vehicleLabel: string;
  loading?: boolean;
}

export function MapView({ position, online, theme, vehicleLabel, loading = false }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);
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

    const raw =
      theme === 'dark'
        ? getComputedStyle(document.documentElement).getPropertyValue('--map-dark')
        : getComputedStyle(document.documentElement).getPropertyValue('--map-light');
    const url = raw.trim().replace(/^['"]|['"]$/g, '') || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    tilesRef.current = L.tileLayer(url, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
  }, [theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !position) return;

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
      return;
    }

    const marker = markerRef.current;
    const element = marker.getElement();
    const arrow = element?.querySelector<HTMLElement>('[data-arrow]');

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

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-[8px] border border-border bg-surface-2">
      <div ref={containerRef} className="h-full w-full" role="application" aria-label={`Mapa en vivo — ${vehicleLabel}`} />
      {loading && (
        <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-[8px] border border-border bg-surface/95 px-2.5 py-1.5 text-[11px] font-semibold text-text-2 shadow-[var(--shadow-card)]">
          Cargando mapa…
        </div>
      )}
    </div>
  );
}
