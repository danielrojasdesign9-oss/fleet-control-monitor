import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchPositions, fetchDevices, TraccarError } from '../lib/traccar';
import type { TraccarDevice, TraccarPosition } from '../types/traccar';

const POLL_MS = 5000;

export type FleetStatus = 'loading' | 'ready' | 'error';

export function useFleetData(baseUrl: string | undefined, active: boolean) {
  const [devices, setDevices] = useState<TraccarDevice[]>([]);
  const [positions, setPositions] = useState<TraccarPosition[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [status, setStatus] = useState<FleetStatus>(active ? 'loading' : 'loading');
  const [error, setError] = useState<TraccarError | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const mountedRef = useRef(true);

  const retry = useCallback(() => {
    setError(null);
    setStatus('loading');
    setRefreshNonce((n) => n + 1);
  }, []);

  const selectDevice = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!active) {
      setStatus('loading');
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let devicesPolls = 0;

    async function refreshDevices() {
      try {
        const list = await fetchDevices(baseUrl);
        if (cancelled || !mountedRef.current) return;
        setDevices(list);
        setSelectedId((current) => {
          if (current !== null && list.some((d) => d.id === current)) return current;
          return list[0]?.id ?? null;
        });
      } catch {
        // refresh silencioso: conserva la lista anterior ante un blip
      }
    }

    async function loadDevices() {
      try {
        const list = await fetchDevices(baseUrl);
        if (cancelled || !mountedRef.current) return;
        setDevices(list);
        setSelectedId((current) => {
          if (current !== null && list.some((d) => d.id === current)) return current;
          return list[0]?.id ?? null;
        });
        setError(null);
        setStatus('ready');
      } catch (err) {
        if (cancelled || !mountedRef.current) return;
        if (err instanceof TraccarError) {
          setError(err);
        } else {
          setError(new TraccarError('Error inesperado al cargar los dispositivos.', 'server'));
        }
        setStatus('error');
      }
    }

    async function pollPositions() {
      devicesPolls += 1;
      if (devicesPolls % 6 === 0) {
        void refreshDevices();
      }
      try {
        const list = await fetchPositions(baseUrl);
        if (cancelled || !mountedRef.current) return;
        setPositions(list);
        setLastUpdated(Date.now());
        setError((prev) => (prev && prev.kind === 'network' ? null : prev));
        setStatus((prev) => (prev === 'ready' ? prev : 'ready'));
      } catch (err) {
        if (cancelled || !mountedRef.current) return;
        if (
          err instanceof TraccarError &&
          (err.kind === 'network' || err.kind === 'auth' || err.kind === 'server')
        ) {
          setError(err);
          setStatus('error');
        }
      } finally {
        if (!cancelled && mountedRef.current) {
          pollTimer = setTimeout(pollPositions, POLL_MS);
        }
      }
    }

    setStatus('loading');
    loadDevices().then(() => {
      if (!cancelled && mountedRef.current) {
        pollTimer = setTimeout(pollPositions, 800);
      }
    });

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [baseUrl, active, refreshNonce]);

  const selectedDevice = devices.find((d) => d.id === selectedId) ?? null;
  const selectedPosition = positions.find((p) => p.deviceId === selectedId) ?? null;
  const positionByDevice = useMemo(() => new Map(positions.map((p) => [p.deviceId, p])), [positions]);

  return {
    devices,
    positions,
    positionByDevice,
    selectedDevice,
    selectedPosition,
    selectedId,
    selectDevice,
    status,
    error,
    lastUpdated,
    retry,
  };
}
