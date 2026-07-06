import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { colors, fonts } from "../theme";

export type DonutSlice = { value: number; color: string };

type Props = {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
};

/** Segmented ring chart with a headline value in the middle. */
export function DonutChart({ slices, size = 168, strokeWidth = 18, centerLabel, centerValue }: Props) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const GAP = total > 0 ? c * 0.012 : 0;

  let offset = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const frac = total > 0 ? s.value / total : 0;
      const len = Math.max(c * frac - GAP, 0);
      const arc = { ...s, len, offset };
      offset += c * frac;
      return { ...arc, key: i };
    });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G rotation={-90} originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {arcs.map((a) => (
            <Circle
              key={a.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={a.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${a.len} ${c - a.len}`}
              strokeDashoffset={-a.offset}
            />
          ))}
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {centerLabel ? <Text style={styles.label}>{centerLabel}</Text> : null}
        {centerValue ? <Text style={styles.value}>{centerValue}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2
  },
  value: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.text
  }
});
