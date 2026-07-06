import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii } from "../theme";
import { fmtPct } from "../lib/format";

type Props = {
  value: number | null;
  /** When true, a rising value is bad (e.g. inflation). */
  invert?: boolean;
  suffix?: string;
};

/** Small pill showing a signed % change with an arrow, tinted by direction. */
export function DeltaChip({ value, invert = false, suffix }: Props) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = invert ? !up : up;
  const tint = good ? colors.positive : colors.negative;
  const bg = good ? colors.accentDim : colors.negativeDim;

  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Ionicons name={up ? "arrow-up" : "arrow-down"} size={11} color={tint} />
      <Text style={[styles.txt, { color: tint }]}>
        {fmtPct(value)}
        {suffix ? ` ${suffix}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    alignSelf: "flex-start"
  },
  txt: {
    fontFamily: fonts.bold,
    fontSize: 12
  }
});
