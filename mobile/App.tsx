import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  TextInput,
  StyleSheet,
  Animated,
  Easing
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import mobileAds, { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { Ionicons } from "@expo/vector-icons";
import { Linking } from "react-native";

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

function formatGenerated(generatedAt: string, lang: Language) {
  if (!generatedAt || generatedAt === "—") return "—";
  const d = new Date(generatedAt);
  if (Number.isNaN(d.getTime())) return generatedAt;

  const locale = lang === "sq" ? "sq-AL" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
}

const copy: Record<Language, Record<string, string>> = {
  en: {
    title: "Salary + Cost of Living",
    refresh: "Refresh",
    status: "Data info",
    generated: "Updated",
    seriesCount: "Datasets",
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
    other: "Other",
    tryAgain: "Try again",
    couldNotLoad: "Couldn’t load data",
    checkConnection: "Check your connection and try again",
    cachedBadge: "Cached",
    liveBadge: "Live"
  },
  sq: {
    title: "Paga + Kosto Jetese",
    refresh: "Rifresko",
    status: "Info të dhënash",
    generated: "Përditësuar",
    seriesCount: "Dataset-e",
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
    other: "Tjetër",
    tryAgain: "Provo përsëri",
    couldNotLoad: "Nuk u ngarkuan të dhënat",
    checkConnection: "Kontrollo internetin dhe provo përsëri",
    cachedBadge: "Cache",
    liveBadge: "Live"
  }
};

const UI = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  border: "rgba(15, 23, 42, 0.08)",
  shadow: "rgba(2, 6, 23, 0.08)",
  accent: "#2563EB",
  accentSoft: "rgba(37, 99, 235, 0.12)",
  dark: "#0B1220",
  warnSoft: "rgba(245, 158, 11, 0.16)",
  warnBorder: "rgba(245, 158, 11, 0.26)"
};

function AnimatedPressable({
  children,
  style,
  contentStyle,
  onPress,
  disabled,
  hitSlop,
  scaleIn = 0.96
}: {
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
  onPress?: () => void;
  disabled?: boolean;
  hitSlop?: any;
  scaleIn?: number;
}) {
  const scale = React.useRef(new Animated.Value(1)).current;
  const PressableAny = require("react-native").Pressable;

  const pressIn = () => {
    if (disabled) return;
    Animated.timing(scale, { toValue: scaleIn, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  const pressOut = () => {
    Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <PressableAny
        onPress={onPress}
        disabled={disabled}
        hitSlop={hitSlop}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={contentStyle}
      >
        {children}
      </PressableAny>
    </Animated.View>
  );
}

function StatCard(props: { icon: any; title: string; value: string; subtitle?: string; tone?: "default" | "accent" }) {
  const tone = props.tone ?? "default";
  return (
    <View style={[styles.card, tone === "accent" ? styles.cardAccent : null]}>
      <View style={styles.cardHead}>
        <View style={[styles.iconBadge, tone === "accent" ? styles.iconBadgeAccent : null]}>
          <Ionicons name={props.icon} size={18} color={tone === "accent" ? UI.accent : UI.muted} />
        </View>
        <Text style={styles.cardTitle}>{props.title}</Text>
      </View>

      <Text style={styles.cardValue}>{props.value}</Text>
      {props.subtitle ? <Text style={styles.cardSub}>{props.subtitle}</Text> : null}
    </View>
  );
}

function Segmented(props: {
  options: { key: string; label: string; icon?: any }[];
  value: string;
  onChange: (v: string) => void;
  wrap?: boolean;
  minItemWidth?: number;
}) {
  const wrap = props.wrap ?? false;

  return (
    <View style={[styles.segWrapBase, wrap ? styles.segWrapWrap : styles.segWrapNoWrap]}>
      {props.options.map((o) => {
        const active = props.value === o.key;

        return (
          <AnimatedPressable
            key={o.key}
            onPress={() => props.onChange(o.key)}
            style={[
              styles.segOuter,
              wrap ? null : styles.segOuterNoWrap,
              wrap && props.minItemWidth ? { minWidth: props.minItemWidth } : null
            ]}
            contentStyle={[styles.segInner, active ? styles.segInnerActive : null]}
            scaleIn={0.98}
          >
            {o.icon ? (
              <Ionicons name={o.icon} size={16} color={active ? UI.card : UI.muted} style={{ marginRight: 8 }} />
            ) : null}
            <Text numberOfLines={1} style={[styles.segTxt, active ? styles.segTxtActive : null]}>
              {o.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

export default function App() {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = React.useState(true);
  const [payload, setPayload] = React.useState<Payload | null>(null);
  const [msg, setMsg] = React.useState("");
  const [fatal, setFatal] = React.useState("");

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
    setFatal("");
    try {
      const url = `${DATA_URL}?t=${Date.now()}`;
      const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      const json = (await res.json()) as Payload;
      setPayload(json);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
    } catch (e: any) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        setPayload(JSON.parse(cached));
        setMsg(t.offline);
      } else {
        setPayload(null);
        setFatal(String(e?.message ?? e ?? "fetch failed"));
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

  const generatedRaw = payload?.generatedAt ?? "—";
  const generatedPretty = formatGenerated(generatedRaw, lang);

  const wage = payload?.latest?.wageAvg ?? null;
  const cpi = payload?.latest?.cpiIndex ?? null;

  const rentValue = Number.isFinite(budget.rent) ? budget.rent : 0;
  const budgetCalc = calcBudget({ ...budget, rent: rentValue });

  const cachedMode = !!msg && msg === t.offline;

  if (!payload && fatal) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: UI.bg }]} edges={["top", "left", "right"]}>
        <View style={[styles.center, { paddingTop: insets.top + 20, paddingHorizontal: 22 }]}>
          <View style={styles.errIcon}>
            <Ionicons name="warning-outline" size={22} color={UI.dark} />
          </View>

          <Text style={styles.errTitle}>{t.couldNotLoad}</Text>
          <Text style={styles.errSub}>{t.checkConnection}</Text>

          <AnimatedPressable onPress={load} style={styles.tryOuter} contentStyle={styles.tryInner}>
            <Ionicons name="refresh" size={18} color={UI.card} style={{ marginRight: 8 }} />
            <Text style={styles.tryTxt}>{t.tryAgain}</Text>
          </AnimatedPressable>

          <Text style={styles.errRaw}>{fatal}</Text>
        </View>

        <View style={[styles.adBar, { paddingBottom: insets.bottom }]}>
          <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: UI.bg }]} edges={["top", "left", "right"]}>
      <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 16 + insets.bottom + 90, gap: 12 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.brandIcon}>
              <Ionicons name="trending-up-outline" size={18} color={UI.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.h1}>{t.title}</Text>

              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Ionicons name="calendar-outline" size={14} color={UI.muted} />
                  <Text style={styles.metaTxt}>{generatedPretty}</Text>
                </View>

                <View style={styles.metaPill}>
                  <Ionicons name={cachedMode ? "cloud-offline-outline" : "pulse-outline"} size={14} color={UI.muted} />
                  <Text style={styles.metaTxt}>{cachedMode ? t.cachedBadge : t.liveBadge}</Text>
                </View>
              </View>
            </View>

            <AnimatedPressable
              onPress={load}
              style={[styles.iconBtnOuter, loading ? styles.iconBtnOuterDisabled : null]}
              contentStyle={styles.iconBtnInner}
              disabled={loading}
              hitSlop={10}
            >
              {loading ? <ActivityIndicator /> : <Ionicons name="refresh" size={18} color={UI.card} />}
            </AnimatedPressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.iconBadge}>
                <Ionicons name="globe-outline" size={18} color={UI.muted} />
              </View>
              <Text style={styles.cardTitle}>{t.lang}</Text>
            </View>

            <Segmented
              value={lang}
              onChange={(v) => saveLang(v as Language)}
              wrap={false}
              options={[
                { key: "en", label: t.english, icon: "language-outline" },
                { key: "sq", label: t.albanian, icon: "chatbubble-ellipses-outline" }
              ]}
            />
          </View>

          {msg ? (
            <View style={styles.notice}>
              <View style={styles.noticeIcon}>
                <Ionicons name="information-circle-outline" size={18} color="#B45309" />
              </View>
              <Text style={styles.noticeTxt}>{msg}</Text>
            </View>
          ) : null}

          <StatCard
            icon="cash-outline"
            title={t.wageTitle}
            value={wage ? `${fmtALL(wage.v)} ALL` : t.noData}
            subtitle={wage ? `${t.period}: ${wage.t}` : t.wageSubtitle}
            tone="accent"
          />

          <StatCard
            icon="stats-chart-outline"
            title={t.cpiTitle}
            value={cpi ? cpi.v.toFixed(2) : t.noData}
            subtitle={cpi ? `${t.month}: ${cpi.t}` : t.cpiSubtitle}
          />

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={[styles.iconBadge, styles.iconBadgeAccent]}>
                <Ionicons name="wallet-outline" size={18} color={UI.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>{t.budgetTitle}</Text>
                <Text style={styles.sectionSub}>{t.budgetSubtitle}</Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>
              <Ionicons name="location-outline" size={14} color={UI.muted} /> {t.city}
            </Text>

            <Segmented
              value={budget.city}
              onChange={(v) => saveBudget({ ...budget, city: v as BudgetScenario["city"] })}
              wrap={true}
              minItemWidth={150}
              options={[
                { key: "Tirana", label: "Tirana", icon: "business-outline" },
                { key: "Durres", label: "Durres", icon: "boat-outline" },
                { key: "Vlore", label: "Vlore", icon: "sunny-outline" },
                { key: "Shkoder", label: "Shkoder", icon: "leaf-outline" },
                { key: "Other", label: t.other, icon: "ellipsis-horizontal" }
              ]}
            />

            <Text style={styles.fieldLabel}>
              <Ionicons name="sparkles-outline" size={14} color={UI.muted} /> {t.lifestyle}
            </Text>

            <Segmented
              value={budget.lifestyle}
              onChange={(v) => saveBudget({ ...budget, lifestyle: v as BudgetScenario["lifestyle"] })}
              wrap={false}
              options={[
                { key: "Basic", label: t.basic, icon: "flash-outline" },
                { key: "Normal", label: t.normal, icon: "checkmark-circle-outline" },
                { key: "Comfort", label: t.comfort, icon: "diamond-outline" }
              ]}
            />

            <Text style={styles.fieldLabel}>
              <Ionicons name="people-outline" size={14} color={UI.muted} /> {t.household}
            </Text>

            <Segmented
              value={String(budget.household)}
              onChange={(v) => saveBudget({ ...budget, household: Number(v) as BudgetScenario["household"] })}
              wrap={false}
              options={[
                { key: "1", label: "1", icon: "person-outline" },
                { key: "2", label: "2", icon: "people-outline" },
                { key: "3", label: "3", icon: "people-outline" },
                { key: "4", label: "4", icon: "people-outline" }
              ]}
            />

            <Text style={styles.fieldLabel}>
              <Ionicons name="home-outline" size={14} color={UI.muted} /> {t.rent}
            </Text>
            <View style={styles.inputWrap}>
              <View style={styles.inputIcon}>
                <Ionicons name="cash-outline" size={16} color={UI.muted} />
              </View>
              <TextInput
                value={String(budget.rent)}
                onChangeText={(txt) => {
                  const num = Number(txt.replace(/[^\d]/g, ""));
                  saveBudget({ ...budget, rent: Number.isFinite(num) ? num : 0 });
                }}
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>

            <View style={styles.resultBox}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t.nonRent}</Text>
                <Text style={styles.resultValue}>{fmtALL(budgetCalc.nonRent)} ALL</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>{t.total}</Text>
                <Text style={styles.resultValue}>{fmtALL(budgetCalc.total)} ALL</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.iconBadge}>
                <Ionicons name="information-circle-outline" size={18} color={UI.muted} />
              </View>
              <Text style={styles.cardTitle}>{lang === "sq" ? "Burimi" : "Source"}</Text>
            </View>

            <View style={styles.sourceRow}>
              <View style={styles.sourceLeft}>
                <View style={styles.sourceLine}>
                  <Ionicons
                    name={cachedMode ? "cloud-offline-outline" : "pulse-outline"}
                    size={16}
                    color={UI.muted}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.sourceTitle}>{cachedMode ? t.cachedBadge : t.liveBadge}</Text>
                </View>

                <Text style={styles.sourceSub}>
                  {lang === "sq" ? "Përditësuar:" : "Updated:"} {generatedPretty}
                </Text>

                <Text style={styles.sourceSub}>
                  {lang === "sq"
                    ? "INSTAT (CPI & Paga)"
                    : "INSTAT (CPI & Wages)"}
                </Text>
              </View>

              <AnimatedPressable
                onPress={() => Linking.openURL(DATA_URL)}
                style={styles.openOuter}
                contentStyle={styles.openInner}
                hitSlop={10}
              >
                <Ionicons name="open-outline" size={16} color={UI.card} style={{ marginRight: 8 }} />
                <Text style={styles.openTxt}>{lang === "sq" ? "Hap" : "Open"}</Text>
              </AnimatedPressable>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Ad bar */}
      {/* <View style={[styles.adBar, { paddingBottom: insets.bottom + (Platform.OS === "android" ? 6 : 0) }]}>
        <BannerAd unitId={adUnitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} />
      </View> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 2 },

  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: UI.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: UI.border
  },

  h1: { fontSize: 22, fontWeight: "900", letterSpacing: -0.3, color: UI.text },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: UI.border
  },
  metaTxt: { color: UI.muted, fontSize: 12, fontWeight: "800" },

  iconBtnOuter: {},
  iconBtnOuterDisabled: { opacity: 0.7 },
  iconBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: UI.dark,
    alignItems: "center",
    justifyContent: "center"
  },

  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: UI.card,
    borderWidth: 1,
    borderColor: UI.border,
    shadowColor: UI.shadow,
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
    gap: 12
  },

  cardAccent: {
    backgroundColor: "rgba(37,99,235,0.06)",
    borderColor: "rgba(37,99,235,0.15)"
  },

  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },

  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: "center",
    justifyContent: "center"
  },
  iconBadgeAccent: {
    backgroundColor: UI.accentSoft,
    borderColor: "rgba(37,99,235,0.18)"
  },

  cardTitle: { fontSize: 14, fontWeight: "900", color: UI.text, opacity: 0.9 },

  sectionTitle: { fontSize: 16, fontWeight: "900", color: UI.text },
  sectionSub: { marginTop: 2, color: UI.muted, fontWeight: "800" },

  cardValue: { fontSize: 28, fontWeight: "900", color: UI.text, letterSpacing: -0.3 },
  cardSub: { color: UI.muted, fontWeight: "800" },

  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    backgroundColor: UI.warnSoft,
    borderWidth: 1,
    borderColor: UI.warnBorder
  },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center"
  },
  noticeTxt: { flex: 1, fontWeight: "900", color: "#92400E" },

  segWrapBase: { flexDirection: "row", gap: 8 },
  segWrapNoWrap: { flexWrap: "nowrap" },
  segWrapWrap: { flexWrap: "wrap" },

  segOuter: { flexGrow: 1 },
  segOuterNoWrap: { flexGrow: 1, minWidth: 0 },

  segInner: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.03)",
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row"
  },
  segInnerActive: {
    backgroundColor: UI.dark,
    borderColor: "rgba(15,23,42,0.18)"
  },
  segTxt: { color: UI.text, fontWeight: "900" },
  segTxtActive: { color: UI.card },

  fieldLabel: { fontWeight: "900", color: UI.muted, marginTop: 6 },

  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  inputIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: "center",
    justifyContent: "center"
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "900",
    color: UI.text,
    backgroundColor: "rgba(15,23,42,0.02)"
  },

  resultBox: {
    marginTop: 6,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: "rgba(15,23,42,0.02)"
  },
  resultRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  resultLabel: { color: UI.muted, fontWeight: "900" },
  resultValue: { color: UI.text, fontWeight: "900" },

  statusRow: { flexDirection: "row", gap: 10 },
  statusItem: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: UI.border,
    backgroundColor: "rgba(15,23,42,0.02)"
  },
  statusLabel: { color: UI.muted, fontWeight: "900" },
  statusValue: { marginTop: 6, color: UI.text, fontWeight: "900" },

  errIcon: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: "rgba(15,23,42,0.04)",
    borderWidth: 1,
    borderColor: UI.border,
    alignItems: "center",
    justifyContent: "center"
  },
  errTitle: { marginTop: 14, fontSize: 18, fontWeight: "900", color: UI.text },
  errSub: { marginTop: 6, color: UI.muted, fontWeight: "800", textAlign: "center" },
  tryOuter: { marginTop: 16 },
  tryInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: UI.dark
  },
  tryTxt: { color: UI.card, fontWeight: "900" },
  errRaw: { marginTop: 14, color: "rgba(15,23,42,0.45)", fontWeight: "800", fontSize: 12, textAlign: "center" },

  sourceRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  sourceLeft: { flex: 1, gap: 6 },

  sourceLine: { flexDirection: "row", alignItems: "center" },
  sourceTitle: { color: UI.text, fontWeight: "900" },
  sourceSub: { color: UI.muted, fontWeight: "800", lineHeight: 18 },

  openOuter: {},
  openInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: UI.dark
  },
  openTxt: { color: UI.card, fontWeight: "900" },

  adBar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: UI.bg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)"
  }
});