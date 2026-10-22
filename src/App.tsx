import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { LoginView, type ConnectResult } from './components/LoginView';
import { DeviceList } from './components/DeviceList';
import { StatusCard } from './components/StatusCard';
import { MapView } from './components/MapView';
import { ErrorState } from './components/ErrorState';
import { DeviceListSkeleton, MapSkeleton, StatusCardSkeleton } from './components/Skeleton';
import { useFleetData } from './hooks/useFleetData';
import { useTheme } from './lib/useTheme';
import { connect } from './lib/traccar';
import { isDeviceOnline } from './lib/format';

type Session =
  | { state: 'anonymous' }
  | { state: 'connecting'; mode: 'simulator' | 'server' }
  | { state: 'connected'; baseUrl?: string; mode: 'simulator' | 'server'; sourceLabel: string };

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<Session>({ state: 'anonymous' });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const active = session.state === 'connected';
  const baseUrl = session.state === 'connected' ? session.baseUrl : undefined;
  const fleet = useFleetData(baseUrl, active);

  const handleConnect = useCallback(async (options: ConnectResult) => {
    setSession({ state: 'connecting', mode: options.mode });
    try {
      await connect(options);
      setSession({
        state: 'connected',
        baseUrl: options.baseUrl,
        mode: options.mode,
        sourceLabel: options.mode === 'simulator' ? 'simulator.traccar.org' : new URL(options.baseUrl || 'https://demo4.traccar.org').host,
      });
    } catch (error) {
      setSession({ state: 'anonymous' });
      throw error;
    }
  }, []);

  const handleBack = useCallback(() => {
    setSession({ state: 'anonymous' });
  }, []);

  const selectedOnline = useMemo(() => {
    if (!fleet.selectedDevice) return false;
    return isDeviceOnline(fleet.selectedDevice, now);
  }, [fleet.selectedDevice, now]);

  if (session.state === 'anonymous' || session.state === 'connecting') {
    return (
      <div className="flex h-full min-h-screen flex-col">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          isLive={false}
          sourceLabel="sin conexión"
        />
        <LoginView onConnect={handleConnect} />
      </div>
    );
  }

  if (fleet.status === 'error' && fleet.error) {
    return (
      <div className="flex h-full min-h-screen flex-col">
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          isLive={false}
          sourceLabel={session.sourceLabel}
          onBack={handleBack}
        />
        <ErrorState error={fleet.error} onRetry={fleet.retry} onBack={handleBack} />
      </div>
    );
  }

  const loading = fleet.status === 'loading';

  return (
    <div className="flex h-full min-h-screen flex-col bg-bg">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        isLive={!loading && fleet.devices.length > 0}
        sourceLabel={session.sourceLabel}
        onBack={handleBack}
      />

      <div className="flex flex-1 flex-col overflow-y-auto lg:min-h-0 lg:flex-row lg:overflow-hidden">
        {loading ? (
          <aside className="w-full shrink-0 border-b border-border bg-surface lg:h-full lg:w-[280px] lg:border-b-0 lg:border-r">
            <div className="border-b border-border px-3 py-3">
              <SkeletonHeader />
            </div>
            <DeviceListSkeleton />
          </aside>
        ) : (
          <DeviceList
            devices={fleet.devices}
            positionByDevice={fleet.positionByDevice}
            selectedId={fleet.selectedId}
            onSelect={fleet.selectDevice}
            now={now}
          />
        )}

        <main className="flex flex-1 gap-4 p-4 lg:min-h-0 lg:flex-row lg:overflow-hidden">
          <div className="min-w-0 flex-1">
            {loading ? (
              <MapSkeleton />
            ) : (
              <MapView
                position={fleet.selectedPosition}
                online={selectedOnline}
                theme={theme}
                vehicleLabel={fleet.selectedDevice?.name ?? 'vehículo seleccionado'}
                loading={loading}
                devices={fleet.devices}
                positionByDevice={fleet.positionByDevice}
                selectedId={fleet.selectedId}
                onSelect={fleet.selectDevice}
                now={now}
              />
            )}
          </div>

          <div className="w-full shrink-0 lg:w-[320px] lg:overflow-y-auto">
            {loading ? <StatusCardSkeleton /> : (
              <StatusCard device={fleet.selectedDevice} position={fleet.selectedPosition} now={now} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="flex items-baseline justify-between gap-2" aria-hidden="true">
      <div className="skeleton h-3 w-16" />
      <div className="skeleton h-3 w-20" />
    </div>
  );
}
