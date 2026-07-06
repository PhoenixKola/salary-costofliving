import React from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { RootTabParamList } from "../navigation/RootNavigator";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import {
  getCpiSeries,
  getWageSeries,
  realWageSeries,
  yoyDelta,
  yoySeries
} from "../lib/calc";
import { fmtCompact, fmtIndex, fmtPct, fmtPeriod, formatGenerated } from "../lib/format";
import { GlowBackground } from "../components/GlowBackground";
import { HeroStat } from "../components/HeroStat";
import { StatTile } from "../components/StatTile";
import { GlassCard } from "../components/GlassCard";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { OfflineToast } from "../components/OfflineToast";
import { Skeleton } from "../components/Skeleton";
import { ErrorState } from "../components/ErrorState";
import { Sparkline } from "../components/Sparkline";
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, type } from "../theme";

type Props = BottomTabScreenProps<RootTabParamList, "Home">;

function greetingKey(): "greetingMorning" | "greetingDay" | "greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "greetingMorning";
  if (h < 18) return "greetingDay";
  return "greetingEvening";
}

export function HomeScreen({ navigation }: Props) {
  const { payload, loading, refreshing, cachedMode, error, refresh } = useData();
  const { t, lang } = useLanguage();

  const cpi = React.useMemo(() => getCpiSeries(payload), [payload]);
  const wage = React.useMemo(() => getWageSeries(payload), [payload]);
  const real = React.useMemo(() => realWageSeries(wage, cpi), [wage, cpi]);
  const inflation = React.useMemo(() => yoySeries(cpi), [cpi]);

  const latestInflation = inflation.length ? inflation[inflation.length - 1] : null;
  const latestWage = wage.length ? wage[wage.length - 1] : null;
  const latestReal = real.length ? real[real.length - 1] : null;
  const wageDelta = React.useMemo(() => yoyDelta(wage), [wage]);
  const realDelta = React.useMemo(() => yoyDelta(real), [real]);

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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <GlowBackground />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.bgElevated}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{t[greetingKey()]} 👋</Text>
            <Text style={type.h1}>{t.appName}</Text>
          </View>
          <View style={styles.updatedPill}>
            <Ionicons
              name={cachedMode ? "cloud-offline-outline" : "pulse-outline"}
              size={13}
              color={cachedMode ? colors.warning : colors.accent}
            />
            <Text style={styles.updatedTxt}>
              {formatGenerated(payload?.generatedAt, lang)}
            </Text>
          </View>
        </View>

        {cachedMode ? <OfflineToast message={t.offline} /> : null}

        {showSkeleton ? (
          <>
            <GlassCard>
              <Skeleton width={140} height={14} style={{ marginBottom: 14 }} />
              <Skeleton width={220} height={52} style={{ marginBottom: 14 }} />
              <Skeleton height={56} />
            </GlassCard>
            <View style={styles.tileRow}>
              <GlassCard style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 10 }} />
                <Skeleton width={100} height={24} />
              </GlassCard>
              <GlassCard style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 10 }} />
                <Skeleton width={100} height={24} />
              </GlassCard>
            </View>
          </>
        ) : (
          <>
            {/* Hero: purchasing power */}
            {latestReal ? (
              <HeroStat
                title={t.heroTitle}
                value={latestReal.v}
                format={fmtIndex}
                delta={realDelta}
                deltaSuffix={t.vsLastYear}
                caption={t.heroCaption}
                spark={real.map((p) => p.v)}
                periodLabel={fmtPeriod(latestReal.t, lang)}
              />
            ) : null}

            {/* Quick tiles */}
            <View style={styles.tileRow}>
              <StatTile
                label={t.inflationYoy}
                value={latestInflation ? fmtPct(latestInflation.v) : t.noData}
                delta={null}
                spark={inflation.slice(-24).map((p) => p.v)}
                sparkColor={colors.chartAlt}
              />
              <StatTile
                label={t.avgWage}
                value={latestWage ? fmtCompact(latestWage.v) : t.noData}
                unit={latestWage ? "ALL" : undefined}
                delta={wageDelta}
                spark={wage.map((p) => p.v)}
              />
            </View>

            {/* Trends teaser */}
            <AnimatedPressable
              onPress={() => navigation.navigate("Trends")}
              haptic
              scaleIn={0.98}
            >
              <GlassCard style={styles.teaser} padded={false}>
                <View style={styles.teaserInner}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.teaserTitle}>{t.seeTrends}</Text>
                    <Text style={styles.teaserSub}>{t.seeTrendsSub}</Text>
                  </View>
                  {cpi.length > 1 ? (
                    <Sparkline
                      values={cpi.slice(-36).map((p) => p.v)}
                      width={80}
                      height={36}
                      color={colors.chartAlt}
                      endDot={false}
                    />
                  ) : null}
                  <Ionicons name="chevron-forward" size={20} color={colors.accent} />
                </View>
              </GlassCard>
            </AnimatedPressable>
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
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: spacing.xs
  },
  greeting: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2
  },
  updatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4
  },
  updatedTxt: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted
  },
  tileRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  teaser: {},
  teaserInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg
  },
  teaserTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 2
  },
  teaserSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted
  }
});
