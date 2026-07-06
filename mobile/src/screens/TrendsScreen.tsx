import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getCpiSeries,
  getWageSeries,
  realWageSeries,
  sliceYears,
  yoySeries
} from "../lib/calc";
import { fmtCompact, fmtIndex, fmtPct } from "../lib/format";
import { GlassCard } from "../components/GlassCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { Segmented } from "../components/Segmented";
import { TrendChart, type ChartSeries } from "../components/TrendChart";
import { Skeleton } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";
import { OfflineToast } from "../components/OfflineToast";
import { AdSlot } from "../components/AdSlot";
import { colors, fonts, spacing, TAB_BAR_CLEARANCE } from "../theme";

type Range = "1" | "3" | "all";

function ChartCard({
  title,
  subtitle,
  latest,
  children,
  legend
}: {
  title: string;
  subtitle: string;
  latest?: string;
  children: React.ReactNode;
  legend?: { color: string; label: string }[];
}) {
  return (
    <GlassCard>
      <View style={styles.chartHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.chartSub}>{subtitle}</Text>
        </View>
        {latest ? <Text style={styles.chartLatest}>{latest}</Text> : null}
      </View>
      {legend ? (
        <View style={styles.legendRow}>
          {legend.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={styles.legendTxt}>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {children}
    </GlassCard>
  );
}

export function TrendsScreen() {
  const { payload, loading, cachedMode, error, refresh } = useData();
  const { t, lang } = useLanguage();
  const [range, setRange] = React.useState<Range>("3");

  const years = range === "all" ? null : Number(range);

  const cpiAll = React.useMemo(() => getCpiSeries(payload), [payload]);
  const wageAll = React.useMemo(() => getWageSeries(payload), [payload]);
  const inflationAll = React.useMemo(() => yoySeries(cpiAll), [cpiAll]);
  const realAll = React.useMemo(() => realWageSeries(wageAll, cpiAll), [wageAll, cpiAll]);

  const cpi = React.useMemo(() => sliceYears(cpiAll, years), [cpiAll, years]);
  const wage = React.useMemo(() => sliceYears(wageAll, years), [wageAll, years]);
  const inflation = React.useMemo(() => sliceYears(inflationAll, years), [inflationAll, years]);
  const real = React.useMemo(() => sliceYears(realAll, years), [realAll, years]);

  if (!payload && error) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <ErrorState
          title={t.couldNotLoad}
          subtitle={t.checkConnection}
          actionLabel={t.tryAgain}
          onAction={refresh}
          detail={error}
        />
      </SafeAreaView>
    );
  }

  const showSkeleton = loading && !payload;

  const realVsNominal: ChartSeries[] = [
    {
      points: real.map((p) => ({ t: p.t, v: p.nominalIndex })),
      color: colors.chartAlt,
      filled: false
    },
    {
      points: real.map((p) => ({ t: p.t, v: p.v })),
      color: colors.accent
    }
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.trendsTitle} subtitle={t.trendsSubtitle} />

        {cachedMode ? <OfflineToast message={t.offline} /> : null}

        <Segmented
          value={range}
          onChange={(v) => setRange(v as Range)}
          options={[
            { key: "1", label: t.rangeY1 },
            { key: "3", label: t.rangeY3 },
            { key: "all", label: t.rangeAll }
          ]}
        />

        {showSkeleton ? (
          <>
            {[0, 1, 2].map((i) => (
              <GlassCard key={i}>
                <Skeleton width={140} height={14} style={{ marginBottom: 12 }} />
                <Skeleton height={160} />
              </GlassCard>
            ))}
          </>
        ) : (
          <>
            {inflation.length > 1 ? (
              <ChartCard
                title={t.chartInflationTitle}
                subtitle={t.chartInflationSub}
                latest={fmtPct(inflation[inflation.length - 1].v)}
              >
                <TrendChart
                  series={[{ points: inflation, color: colors.accent }]}
                  lang={lang}
                  formatValue={(v) => fmtPct(v)}
                />
              </ChartCard>
            ) : null}

            {cpi.length > 1 ? (
              <ChartCard
                title={t.chartCpiTitle}
                subtitle={t.chartCpiSub}
                latest={fmtIndex(cpi[cpi.length - 1].v)}
              >
                <TrendChart
                  series={[{ points: cpi, color: colors.chartAlt }]}
                  lang={lang}
                  formatValue={fmtIndex}
                />
              </ChartCard>
            ) : null}

            {wage.length > 1 ? (
              <ChartCard
                title={t.chartWageTitle}
                subtitle={t.chartWageSub}
                latest={`${fmtCompact(wage[wage.length - 1].v)} ALL`}
              >
                <TrendChart
                  series={[{ points: wage, color: colors.accent }]}
                  lang={lang}
                  formatValue={fmtCompact}
                />
              </ChartCard>
            ) : null}

            {real.length > 1 ? (
              <ChartCard
                title={t.chartRealTitle}
                subtitle={t.chartRealSub}
                legend={[
                  { color: colors.chartAlt, label: t.legendNominal },
                  { color: colors.accent, label: t.legendReal }
                ]}
              >
                <TrendChart series={realVsNominal} lang={lang} formatValue={fmtIndex} />
              </ChartCard>
            ) : null}

            <AdSlot />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: spacing.md
  },
  chartHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  chartTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2
  },
  chartSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted
  },
  chartLatest: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.accent
  },
  legendRow: {
    flexDirection: "row",
    gap: spacing.lg,
    marginBottom: spacing.md
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendTxt: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textSecondary
  }
});
