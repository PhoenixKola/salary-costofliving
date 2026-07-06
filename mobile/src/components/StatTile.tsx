import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GlassCard } from "./GlassCard";
import { Sparkline } from "./Sparkline";
import { DeltaChip } from "./DeltaChip";
import { colors, fonts, spacing } from "../theme";

type Props = {
  label: string;
  value: string;
  unit?: string;
  delta?: number | null;
  invertDelta?: boolean;
  spark?: number[];
  sparkColor?: string;
};

/** Compact glass tile: label, big value, delta chip and a mini sparkline. */
export function StatTile({ label, value, unit, delta, invertDelta, spark, sparkColor }: Props) {
  return (
    <GlassCard style={styles.tile}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <View style={styles.footer}>
        {delta !== undefined ? <DeltaChip value={delta ?? null} invert={invertDelta} /> : <View />}
        {spark && spark.length > 1 ? (
          <Sparkline values={spark} width={72} height={26} color={sparkColor ?? colors.accent} />
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 6
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    marginBottom: spacing.sm
  },
  value: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text,
    flexShrink: 1
  },
  unit: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 3
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  }
});
