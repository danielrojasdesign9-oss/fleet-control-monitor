import {
  TraccarError,
  type TraccarDevice,
  type TraccarPosition,
  type TraccarServer,
  type TraccarUser,
} from '../types/traccar';

export { TraccarError };
export type { TraccarDevice, TraccarPosition, TraccarServer, TraccarUser };

const DEFAULT_BASE = import.meta.env.VITE_TRACCAR_URL ?? '/traccar';

export interface TraccarClientOptions {
  baseUrl?: string;
}

function normalizeBase(baseUrl?: string): string {
  const base = (baseUrl ?? DEFAULT_BASE).trim().replace(/\/+$/, '');
  return base.length > 0 ? base : DEFAULT_BASE;
}

function mapHttpError(status: number, bodyText: string): TraccarError {
  if (status === 401 || status === 403) {
    const readOnly = /read-only/i.test(bodyText);
    return new TraccarError(
      readOnly
        ? 'Este servidor de demostración es de solo lectura.'
        : 'Credenciales inválidas o sesión expirada.',
      'auth',
      status,
    );
  }
  if (status >= 500) {
    return new TraccarError('El servidor de Traccar no está disponible en este momento.', 'server', status);
  }
  return new TraccarError(`El servidor respondió con un error inesperado (${status}).`, 'server', status);
}

async function request<T>(base: string, path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      credentials: 'include',
      ...init,
    });
  } catch {
    throw new TraccarError(
      'No se pudo conectar con el servidor. Revisa tu conexión o la configuración del proxy.',
      'network',
    );
  }

  const text = await response.text();

  if (!response.ok) {
    throw mapHttpError(response.status, text);
  }

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new TraccarError('El servidor devolvió una respuesta que no se pudo interpretar.', 'server');
  }
}

export async function login(email: string, password: string, baseUrl?: string): Promise<TraccarUser> {
  const base = normalizeBase(baseUrl);
  const body = new URLSearchParams({ email, password });
  return request<TraccarUser>(base, '/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

export async function fetchServer(baseUrl?: string): Promise<TraccarServer> {
  return request<TraccarServer>(normalizeBase(baseUrl), '/server');
}

export async function fetchDevices(baseUrl?: string): Promise<TraccarDevice[]> {
  return request<TraccarDevice[]>(normalizeBase(baseUrl), '/devices');
}

export async function fetchPositions(baseUrl?: string, deviceId?: number): Promise<TraccarPosition[]> {
  const query = deviceId !== undefined ? `?deviceId=${deviceId}` : '';
  return request<TraccarPosition[]>(normalizeBase(baseUrl), `/positions${query}`);
}

/**
 * Conecta con un servidor Traccar.
 * - `simulator`: intenta sesión y continúa en modo lectura si el servidor la rechaza
 *   (el simulador oficial expone /devices y /positions sin credenciales).
 * - `server`: exige login con email/password válidos.
 */
export async function connect(options: {
  mode: 'simulator' | 'server';
  baseUrl?: string;
  email?: string;
  password?: string;
}): Promise<{ user: TraccarUser | null; devices: TraccarDevice[] }> {
  const base = normalizeBase(options.baseUrl);
  let user: TraccarUser | null = null;

  if (options.mode === 'server') {
    if (!options.email || !options.password) {
      throw new TraccarError('Ingresa el email y la contraseña del servidor.', 'auth');
    }
    user = await login(options.email, options.password, base);
  } else {
    try {
      user = await login('demo', 'demo', base);
    } catch (error) {
      if (!(error instanceof TraccarError) || error.kind !== 'auth') {
        throw error;
      }
    }
  }

  const devices = await fetchDevices(base);
  return { user, devices };
}
