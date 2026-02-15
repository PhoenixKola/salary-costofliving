import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

type Payload = { generatedAt: string; series: any[] };

const CACHE_KEY = "salary_costofliving_latest_v1";
const DATA_URL = "https://raw.githubusercontent.com/PhoenixKola/salary-costofliving/main/data/latest.json";

function Card(props: { title: string; value: string; subtitle?: string }) {
  return (
    <View
      style={{
        padding: 14,
        borderRadius: 16,
        backgroundColor: "rgba(0,0,0,0.06)",
        gap: 6
      }}
    >
      <Text style={{ opacity: 0.7 }}>{props.title}</Text>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{props.value}</Text>
      {props.subtitle ? <Text style={{ opacity: 0.7 }}>{props.subtitle}</Text> : null}
    </View>
  );
}

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

  const generated = payload?.generatedAt ?? "—";
  const seriesCount = payload?.series?.length ?? 0;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
          <Text style={{ fontSize: 26, fontWeight: "800" }}>Salary + Cost of Living</Text>

          {msg ? (
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: "rgba(255,165,0,0.15)" }}>
              <Text>{msg}</Text>
            </View>
          ) : null}

          <Card title="Wage (quarterly)" value={seriesCount ? "—" : "No data yet"} subtitle="From INSTAT Wage tables" />
          <Card title="Inflation (YoY)" value={seriesCount ? "—" : "No data yet"} subtitle="From INSTAT CPI tables" />
          <Card title="Budget (monthly)" value="Coming next" subtitle="City + lifestyle + household scenario" />

          <View style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", gap: 6 }}>
            <Text style={{ opacity: 0.7 }}>Status</Text>
            <Text style={{ fontWeight: "700" }}>Generated</Text>
            <Text>{generated}</Text>
            <Text style={{ opacity: 0.7 }}>Series count: {seriesCount}</Text>
          </View>

          <Pressable
            onPress={load}
            style={{
              marginTop: 4,
              padding: 14,
              borderRadius: 16,
              backgroundColor: "black",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800" }}>Refresh</Text>}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}