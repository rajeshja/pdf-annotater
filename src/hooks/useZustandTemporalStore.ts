
"use client";

import { useSyncExternalStore } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import type { TemporalState, StoreWithTemporal } from 'zundo';
import type { AppState } from '@/lib/store';

// Type definitions for the temporal store
type UseTemporalStore<T> = {
  (): T;
  <U>(selector: (state: T) => U, equality?: (a: U, b: U) => boolean): U;
};

// Custom hook to access the temporal state of the main store
export const useZustandTemporalStore = <S extends AppState>(
  store: UseBoundStore<StoreApi<S>> & { temporal: TemporalState<S> }
) => {
  const temporal = useSyncExternalStore(
    store.temporal.subscribe,
    store.temporal.getState
  );

  return temporal;
};
