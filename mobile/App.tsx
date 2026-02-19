import React from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View, TextInput, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import mobileAds, { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

type LatestPoint = { t: string; v: number };

type Payload = {
  generatedAt: string;
  series: any[];
  latest?: {
    cpiIndex?: LatestPoint | null;
    cpiYoy?: LatestPoint | null;
    wageAvg?: LatestPoint | null;
  };
};

type Language = "en" | "sq";

type BudgetScenario = {
  city: "Tirana" | "Durres" | "Shkoder" | "Vlore" | "Other";
  lifestyle: "Basic" | "Normal" | "Comfort";
  household: 1 | 2 | 3 | 4;
  rent: number;
};

const CACHE_KEY = "salary_costofliving_latest_v3";
const DATA_URL = "https://raw.githubusercontent.com/PhoenixKola/salary-costofliving/main/data/latest.json";

const BUDGET_KEY = "salary_costofliving_budget_v1";
const LANG_KEY = "salary_costofliving_lang_v1";

const BASE_NON_RENT = {
  Basic: 28000,
  Normal: 42000,
  Comfort: 60000
} as const;

const CITY_MULT = {
  Tirana: 1.15,
  Durres: 1.05,
  Shkoder: 0.95,
  Vlore: 1.0,
  Other: 0.95
} as const;

const HOUSEHOLD_MULT: Record<BudgetScenario["household"], number> = {
  1: 1.0,
  2: 1.55,
  3: 1.95,
  4: 2.3
};

function calcBudget(s: BudgetScenario) {
  const nonRent = BASE_NON_RENT[s.lifestyle] * CITY_MULT[s.city] * HOUSEHOLD_MULT[s.household];
  const total = nonRent + s.rent;
  return { nonRent, total };
}

function fmtALL(n: number) {
  return Math.round(n).toLocaleString();
}

const copy: Record<Language, Record<string, string>> = {
  en: {
    title: "Salary + Cost of Living",
    refresh: "Refresh",
    status: "Status",
    generated: "Generated",
    seriesCount: "Series count",
    offline: "Offline mode: showing cached data",
    noData: "No data yet",
    wageTitle: "Wage (quarterly)",
    cpiTitle: "CPI index (monthly)",
    wageSubtitle: "From INSTAT Wage tables",
    cpiSubtitle: "From INSTAT CPI tables",
    period: "Period",
    month: "Month",
    budgetTitle: "Budget (monthly)",
    budgetSubtitle: "Simple estimate (editable)",
    city: "City",
    lifestyle: "Lifestyle",
    household: "Household",
    rent: "Rent (ALL)",
    nonRent: "Non-rent estimate",
    total: "Total / month",
    lang: "Language",
    english: "English",
    albanian: "Albanian",
    basic: "Basic",
    normal: "Normal",
    comfort: "Comfort",
    other: "Other"
  },
  sq: {
    title: "Paga + Kosto Jetese",
    refresh: "Rifresko",
    status: "Statusi",
    generated: "Gjeneruar",
    seriesCount: "Numri i serive",
    offline: "Offline: po shfaqen të dhënat e ruajtura",
    noData: "S’ka të dhëna ende",
    wageTitle: "Paga (tremujore)",
    cpiTitle: "Indeksi i Çmimeve (mujor)",
    wageSubtitle: "Nga tabelat e pagave (INSTAT)",
    cpiSubtitle: "Nga tabelat e IÇK (INSTAT)",
    period: "Periudha",
    month: "Muaji",
    budgetTitle: "Buxheti (mujor)",
    budgetSubtitle: "Vlerësim i thjeshtë (i ndryshueshëm)",
    city: "Qyteti",
    lifestyle: "Stili i jetesës",
    household: "Familja",
    rent: "Qiraja (ALL)",
    nonRent: "Shpenzime pa qira",
    total: "Totali / muaj",
    lang: "Gjuha",
    english: "Anglisht",
    albanian: "Shqip",
    basic: "Bazik",
    normal: "Normal",
    comfort: "Komod",
    other: "Tjetër"
  }
};

function Card(props: { title: string; value: string; subtitle?: string }) {
  return (
    <View style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", gap: 6 }}>
      <Text style={{ opacity: 0.7 }}>{props.title}</Text>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{props.value}</Text>
      {props.subtitle ? <Text style={{ opacity: 0.7 }}>{props.subtitle}</Text> : null}
    </View>
  );
}

function Segmented(props: { options: { key: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {props.options.map((o) => (
        <Pressable
          key={o.key}
          onPress={() => props.onChange(o.key)}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: props.value === o.key ? "black" : "rgba(0,0,0,0.08)",
            alignItems: "center"
          }}
        >
          <Text style={{ color: props.value === o.key ? "white" : "black", fontWeight: "700" }}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function App() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = React.useState(true);
  const [payload, setPayload] = React.useState<Payload | null>(null);
  const [msg, setMsg] = React.useState("");

  const [lang, setLang] = React.useState<Language>("en");

  const [budget, setBudget] = React.useState<BudgetScenario>({
    city: "Tirana",
    lifestyle: "Normal",
    household: 1,
    rent: 45000
  });

  const t = copy[lang];

  const adUnitId = __DEV__ ? TestIds.BANNER : "ca-app-pub-2653462201538649/2513886493";

  const saveLang = React.useCallback(async (next: Language) => {
    setLang(next);
    await AsyncStorage.setItem(LANG_KEY, next);
  }, []);

  const saveBudget = React.useCallback(async (next: BudgetScenario) => {
    setBudget(next);
    await AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(next));
  }, []);

  const load = React.useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const url = `${DATA_URL}?t=${Date.now()}`;
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) throw new Error("fetch failed");
      const json = (await res.json()) as Payload;
      setPayload(json);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
    } catch {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setPayload(JSON.parse(cached));
        setMsg(t.offline);
      } else {
        setMsg(t.noData);
      }
    } finally {
      setLoading(false);
    }
  }, [t.offline, t.noData]);

  React.useEffect(() => {
    mobileAds().initialize();

    (async () => {
      const savedLang = await AsyncStorage.getItem(LANG_KEY);
      if (savedLang === "en" || savedLang === "sq") setLang(savedLang);

      const savedBudget = await AsyncStorage.getItem(BUDGET_KEY);
      if (savedBudget) setBudget(JSON.parse(savedBudget));

      load();
    })();
  }, [load]);

  const seriesCount = payload?.series?.length ?? 0;
  const generated = payload?.generatedAt ?? "—";

  const wage = payload?.latest?.wageAvg ?? null;
  const cpi = payload?.latest?.cpiIndex ?? null;

  const rentValue = Number.isFinite(budget.rent) ? budget.rent : 0;
  const budgetCalc = calcBudget({ ...budget, rent: rentValue });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top", "left", "right", "bottom"]}>
      <View style={{ flex: 1, padding: 16, paddingTop: insets.top + 12 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 26, fontWeight: "800" }}>{t.title}</Text>

          <View style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", gap: 10 }}>
            <Text style={{ opacity: 0.7 }}>{t.lang}</Text>
            <Segmented
              value={lang}
              onChange={(v) => saveLang(v as Language)}
              options={[
                { key: "en", label: t.english },
                { key: "sq", label: t.albanian }
              ]}
            />
          </View>

          {msg ? (
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: "rgba(255,165,0,0.15)" }}>
              <Text>{msg}</Text>
            </View>
          ) : null}

          <Card
            title={t.wageTitle}
            value={wage ? `${fmtALL(wage.v)} ALL` : t.noData}
            subtitle={wage ? `${t.period}: ${wage.t}` : t.wageSubtitle}
          />

          <Card
            title={t.cpiTitle}
            value={cpi ? cpi.v.toFixed(2) : t.noData}
            subtitle={cpi ? `${t.month}: ${cpi.t}` : t.cpiSubtitle}
          />

          <View style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "800" }}>{t.budgetTitle}</Text>
            <Text style={{ opacity: 0.7 }}>{t.budgetSubtitle}</Text>

            <Text style={{ fontWeight: "700" }}>{t.city}</Text>
            <Segmented
              value={budget.city}
              onChange={(v) => saveBudget({ ...budget, city: v as BudgetScenario["city"] })}
              options={[
                { key: "Tirana", label: "Tirana" },
                { key: "Durres", label: "Durres" },
                { key: "Vlore", label: "Vlore" },
                { key: "Shkoder", label: "Shkoder" },
                { key: "Other", label: t.other }
              ]}
            />

            <Text style={{ fontWeight: "700" }}>{t.lifestyle}</Text>
            <Segmented
              value={budget.lifestyle}
              onChange={(v) => saveBudget({ ...budget, lifestyle: v as BudgetScenario["lifestyle"] })}
              options={[
                { key: "Basic", label: t.basic },
                { key: "Normal", label: t.normal },
                { key: "Comfort", label: t.comfort }
              ]}
            />

            <Text style={{ fontWeight: "700" }}>{t.household}</Text>
            <Segmented
              value={String(budget.household)}
              onChange={(v) => saveBudget({ ...budget, household: Number(v) as BudgetScenario["household"] })}
              options={[
                { key: "1", label: "1" },
                { key: "2", label: "2" },
                { key: "3", label: "3" },
                { key: "4", label: "4" }
              ]}
            />

            <Text style={{ fontWeight: "700" }}>{t.rent}</Text>
            <TextInput
              value={String(budget.rent)}
              onChangeText={(txt) => {
                const num = Number(txt.replace(/[^\d]/g, ""));
                saveBudget({ ...budget, rent: Number.isFinite(num) ? num : 0 });
              }}
              keyboardType="numeric"
              placeholder="0"
              style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "white" }}
            />

            <View style={{ gap: 6, paddingTop: 6 }}>
              <Text style={{ opacity: 0.7 }}>
                {t.nonRent}: <Text style={{ fontWeight: "800" }}>{fmtALL(budgetCalc.nonRent)} ALL</Text>
              </Text>
              <Text style={{ opacity: 0.7 }}>
                {t.total}: <Text style={{ fontWeight: "800" }}>{fmtALL(budgetCalc.total)} ALL</Text>
              </Text>
            </View>
          </View>

          <View style={{ padding: 14, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", gap: 6 }}>
            <Text style={{ opacity: 0.7 }}>{t.status}</Text>
            <Text style={{ fontWeight: "700" }}>{t.generated}</Text>
            <Text>{generated}</Text>
            <Text style={{ opacity: 0.7 }}>
              {t.seriesCount}: {seriesCount}
            </Text>
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
            {loading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white", fontWeight: "800" }}>{t.refresh}</Text>}
          </Pressable>
        </ScrollView>
      </View>

      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "rgba(0,0,0,0.06)",
          paddingBottom: Platform.OS === "android" ? 6 : 0
        }}
      >
        <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View>
    </SafeAreaView>
  );
}