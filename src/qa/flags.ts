import { useSyncExternalStore } from 'react';

/**
 * Flags del laboratorio QA (?qa=1).
 * Store mínimo fuera de React: los flags deben poder leerse desde
 * useFleetData (inyección de fallos) sin prop drilling.
 */

export type QaFault = 'none' | 'network' | 'auth' | 'server' | 'empty';

export interface QaState {
  fault: QaFault;
  forceLoading: boolean;
  highContrastMap: boolean;
}

let state: QaState = { fault: 'none', forceLoading: false, highContrastMap: false };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function setQaFault(fault: QaFault): void {
  state = { ...state, fault };
  emit();
}

export function setQaForceLoading(forceLoading: boolean): void {
  state = { ...state, forceLoading };
  emit();
}

export function setQaHighContrastMap(highContrastMap: boolean): void {
  state = { ...state, highContrastMap };
  emit();
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): QaState {
  return state;
}

export function useQaState(): QaState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function isQaEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('qa');
}
