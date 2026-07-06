import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Payload } from "../types";

const CACHE_KEY = "salary_costofliving_latest_v3";
export const DATA_URL =
  "https://raw.githubusercontent.com/PhoenixKola/salary-costofliving/main/data/latest.json";

type DataState = {
  payload: Payload | null;
  loading: boolean;
  refreshing: boolean;
  cachedMode: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const DataContext = React.createContext<DataState>({
  payload: null,
  loading: true,
  refreshing: false,
  cachedMode: false,
  error: null,
  refresh: async () => {}
});

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = React.useState<Payload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [cachedMode, setCachedMode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`, {
        headers: { "cache-control": "no-cache" }
      });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = (await res.json()) as Payload;
      setPayload(json);
      setCachedMode(false);
      setError(null);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
    } catch (e: any) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setPayload(JSON.parse(cached));
        setCachedMode(true);
        setError(null);
      } else {
        setPayload(null);
        setError(String(e?.message ?? e ?? "fetch failed"));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    load(false);
  }, [load]);

  const refresh = React.useCallback(() => load(true), [load]);

  const value = React.useMemo(
    () => ({ payload, loading, refreshing, cachedMode, error, refresh }),
    [payload, loading, refreshing, cachedMode, error, refresh]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return React.useContext(DataContext);
}
