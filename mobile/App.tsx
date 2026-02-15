import React from "react";
import { SafeAreaView, Text, View, Pressable, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Payload = { generatedAt: string; series: any[] };

const CACHE_KEY = "salary_costofliving_latest_v1";
const DATA_URL = "https://raw.githubusercontent.com/PhoenixKola/salary-costofliving/main/data/latest.json";

export default function App() {
  const [loading, setLoading] = React.useState(true);
  const [payload, setPayload] = React.useState<Payload | null>(null);
  const [msg, setMsg] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(DATA_URL, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) throw new Error("fetch failed");
      const json = (await res.json()) as Payload;
      setPayload(json);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
    } catch {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setPayload(JSON.parse(cached));
        setMsg("Offline mode: showing cached data");
      } else {
        setMsg("No data yet");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Salary + Cost of Living</Text>

      {msg ? (
        <View style={{ padding: 10, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.06)" }}>
          <Text>{msg}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator />
      ) : (
        <>
          <View style={{ padding: 12, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)" }}>
            <Text style={{ opacity: 0.7 }}>Generated</Text>
            <Text style={{ fontSize: 16, fontWeight: "700" }}>{payload?.generatedAt ?? "—"}</Text>
            <Text style={{ opacity: 0.7 }}>Series count: {payload?.series?.length ?? 0}</Text>
          </View>

          <Pressable onPress={load} style={{ padding: 14, borderRadius: 16, backgroundColor: "black" }}>
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>Refresh</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}