"use client";

import { useMemo, useSyncExternalStore } from "react";
import { getBrowserStorageSnapshot, parseStorageArray, subscribeToStorage } from "@/lib/storage";

export function useStorageCollection<T>(key: string, initial: T[]) {
  const fallback = useMemo(() => JSON.stringify(initial), [initial]);
  const serialized = useSyncExternalStore(
    subscribeToStorage,
    () => getBrowserStorageSnapshot(key, fallback),
    () => fallback,
  );

  return useMemo(() => parseStorageArray(serialized, initial), [initial, serialized]);
}
