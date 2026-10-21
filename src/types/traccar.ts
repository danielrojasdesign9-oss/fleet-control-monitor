export interface TraccarServer {
  id: number;
  version?: string;
  readonly?: boolean;
}

export interface TraccarUser {
  id: number;
  name: string;
  email: string;
  administrator?: boolean;
}

export interface TraccarDevice {
  id: number;
  name: string;
  uniqueId: string;
  status: string;
  category?: string | null;
  lastUpdate?: string | null;
  positionId?: number;
  model?: string | null;
}

export interface TraccarPosition {
  id: number;
  deviceId: number;
  protocol?: string;
  serverTime: string;
  deviceTime: string;
  fixTime: string;
  valid: boolean;
  outdated: boolean;
  latitude: number;
  longitude: number;
  altitude?: number;
  speed: number;
  course: number;
  address?: string | null;
  attributes?: Record<string, unknown>;
}

export type ConnectionKind = 'network' | 'auth' | 'server' | 'empty';

export class TraccarError extends Error {
  readonly kind: ConnectionKind;
  readonly status?: number;

  constructor(message: string, kind: ConnectionKind, status?: number) {
    super(message);
    this.name = 'TraccarError';
    this.kind = kind;
    this.status = status;
  }
}
