import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GlassCard } from "./GlassCard";
import { CountUp } from "./CountUp";
import { DeltaChip } from "./DeltaChip";
import { Sparkline } from "./Sparkline";
import { colors, fonts, spacing } from "../theme";

type Props = {
  title: string;
  value: number;
  format: (n: number) => string;
  delta: number | null;
  deltaSuffix?: string;
  caption: string;
  spark: number[];
  periodLabel?: string;
};

/** The home hero: one oversized animated number that owns the screen. */
export function HeroStat({ title, value, format, delta, deltaSuffix, caption, spark, periodLabel }: Props) {
  const { width } = useWindowDimensions();

  return (
    <GlassCard glow>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {periodLabel ? <Text style={styles.period}>{periodLabel}</Text> : null}
      </View>

      <CountUp value={value} format={format} style={styles.value} />

      <View style={styles.deltaRow}>
        <DeltaChip value={delta} suffix={deltaSuffix} />
      </View>

      {spark.length > 1 ? (
        <View style={styles.spark}>
          <Sparkline values={spark} width={width - 32 - 32} height={56} strokeWidth={2.5} />
        </View>
      ) : null}

      <Text style={styles.caption}>{caption}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.accent
  },
  period: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted
  },
  value: {
    fontFamily: fonts.extrabold,
    fontSize: 56,
    letterSpacing: -2,
    color: colors.text,
    lineHeight: 62
  },
  deltaRow: {
    flexDirection: "row",
    marginTop: 2,
    marginBottom: spacing.md
  },
  spark: {
    marginBottom: spacing.md
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted
  }
});
