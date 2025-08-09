"use client";

import { useState, useEffect, useSyncExternalStore } from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';

type TemporalState<T> = {
  pastStates: T[];
  futureStates: T[];
  undo: (steps?: number) => void;
  redo: (steps?: number) => void;
  clear: () => void;
  isTracking: boolean;
  pause: () => void;
  resume: () => void;
};

type WithTemporal<S> = S & {
  temporal: TemporalState<S>;
};

type UseTemporalStore<S> = {
  (): TemporalState<S>;
  <U>(selector: (state: TemporalState<S>) => U): U;
};

export const useZustandTemporalStore = <S extends StoreApi<object>>(
  store: S
) => {
    const temporalStore = (store as any).temporal as StoreApi<TemporalState<S>>;

    const [state, setState] = useState(temporalStore.getState());

    useEffect(() => {
        const unsubscribe = temporalStore.subscribe(
            (newState) => {
                setState(newState);
            }
        );
        return unsubscribe;
    }, [temporalStore]);

    return state;
};
