import React from "react";
import { Animated, Easing, PanResponder, Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Line, Path, Stop, Circle } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { colors, fonts } from "../theme";
import { fmtAxisLabel } from "../lib/format";
import type { Language } from "../types";
import { areaPath, scalePoints, smoothPath, tickIndices, type XY } from "./chartPath";

export type ChartSeries = {
  /** All series in one chart must share the same t-axis (equal length). */
  points: { t: string; v: number }[];
  color: string;
  label?: string;
  filled?: boolean;
};

type Props = {
  series: ChartSeries[];
  height?: number;
  lang: Language;
  formatValue: (v: number) => string;
};

const X_STRIP = 20;
const PAD_Y = 8;

let gradSeq = 0;

/**
 * Full-width area/line chart with y-grid, sparse x labels and touch scrubbing
 * (drag to inspect any point; a tooltip follows the finger).
 */
export function TrendChart({ series, height = 180, lang, formatValue }: Props) {
  const [width, setWidth] = React.useState(0);
  const [scrub, setScrub] = React.useState<number | null>(null);
  const gradBase = React.useRef(`trend-${gradSeq++}`).current;
  const appear = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [appear]);

  const main = series[0];
  const n = main?.points.length ?? 0;

  const allValues = series.flatMap((s) => s.points.map((p) => p.v));
  const domain = {
    min: Math.min(...allValues),
    max: Math.max(...allValues)
  };

  const chartH = height - X_STRIP;

  const scaled: XY[][] = React.useMemo(() => {
    if (width === 0 || n < 2) return [];
    return series.map((s) =>
      scalePoints(
        s.points.map((p) => p.v),
        width,
        chartH,
        PAD_Y,
        domain
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, series, chartH]);

  const lastScrub = React.useRef<number | null>(null);
  const pan = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderMove: (e) => handleTouch(e.nativeEvent.locationX),
      onPanResponderRelease: () => setScrub(null),
      onPanResponderTerminate: () => setScrub(null)
    })
  ).current;

  const widthRef = React.useRef(0);
  const nRef = React.useRef(0);
  widthRef.current = width;
  nRef.current = n;

  function handleTouch(x: number) {
    const w = widthRef.current;
    const count = nRef.current;
    if (w === 0 || count < 2) return;
    const idx = Math.min(count - 1, Math.max(0, Math.round((x / w) * (count - 1))));
    if (lastScrub.current !== idx) {
      lastScrub.current = idx;
      if (Platform.OS !== "web") Haptics.selectionAsync().catch(() => {});
      setScrub(idx);
    }
  }

  if (n < 2) {
    return <View style={{ height }} />;
  }

  const gridLines = [0.25, 0.5, 0.75];
  const gridValues = gridLines.map((f) => domain.max - (domain.max - domain.min) * f);
  const ticks = tickIndices(n, 5);
  const scrubX = scrub !== null && scaled[0] ? scaled[0][scrub].x : 0;
  const tooltipLeft =
    scrub !== null ? Math.min(Math.max(scrubX - 60, 0), Math.max(width - 120, 0)) : 0;

  return (
    <Animated.View
      style={{
        opacity: appear,
        transform: [
          {
            translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12, 0] })
          }
        ]
      }}
    >
      <View
        style={{ height }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        {...pan.panHandlers}
      >
        {width > 0 ? (
          <>
            <Svg width={width} height={chartH}>
              <Defs>
                {series.map((s, i) => (
                  <LinearGradient key={i} id={`${gradBase}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={s.color} stopOpacity={0.25} />
                    <Stop offset="1" stopColor={s.color} stopOpacity={0} />
                  </LinearGradient>
                ))}
              </Defs>

              {gridLines.map((f, i) => (
                <Line
                  key={i}
                  x1={0}
                  x2={width}
                  y1={PAD_Y + (chartH - PAD_Y * 2) * f}
                  y2={PAD_Y + (chartH - PAD_Y * 2) * f}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
              ))}

              {scaled.map((pts, i) =>
                series[i].filled !== false ? (
                  <Path key={`a${i}`} d={areaPath(pts, chartH)} fill={`url(#${gradBase}-${i})`} />
                ) : null
              )}
              {scaled.map((pts, i) => (
                <Path
                  key={`l${i}`}
                  d={smoothPath(pts)}
                  stroke={series[i].color}
                  strokeWidth={2.5}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

              {scrub !== null ? (
                <>
                  <Line
                    x1={scrubX}
                    x2={scrubX}
                    y1={0}
                    y2={chartH}
                    stroke="rgba(255,255,255,0.25)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                  {scaled.map((pts, i) => (
                    <Circle
                      key={`d${i}`}
                      cx={pts[scrub].x}
                      cy={pts[scrub].y}
                      r={4.5}
                      fill={series[i].color}
                      stroke={colors.bgElevated}
                      strokeWidth={2}
                    />
                  ))}
                </>
              ) : null}
            </Svg>

            {/* Y grid labels */}
            {gridValues.map((v, i) => (
              <Text
                key={i}
                style={[styles.gridLabel, { top: PAD_Y + (chartH - PAD_Y * 2) * gridLines[i] - 14 }]}
              >
                {formatValue(v)}
              </Text>
            ))}

            {/* X axis labels */}
            <View style={styles.xRow}>
              {ticks.map((idx) => (
                <Text key={idx} style={styles.xLabel}>
                  {fmtAxisLabel(main.points[idx].t, lang)}
                </Text>
              ))}
            </View>

            {/* Scrub tooltip */}
            {scrub !== null ? (
              <View style={[styles.tooltip, { left: tooltipLeft }]} pointerEvents="none">
                <Text style={styles.tooltipPeriod}>{main.points[scrub].t}</Text>
                {series.map((s, i) => (
                  <View key={i} style={styles.tooltipRow}>
                    <View style={[styles.dot, { backgroundColor: s.color }]} />
                    <Text style={styles.tooltipValue}>{formatValue(s.points[scrub].v)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gridLabel: {
    position: "absolute",
    left: 2,
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textMuted
  },
  xRow: {
    height: X_STRIP,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  xLabel: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textMuted
  },
  tooltip: {
    position: "absolute",
    top: 4,
    width: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: "rgba(14,15,23,0.97)",
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 3
  },
  tooltipPeriod: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textSecondary
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  tooltipValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text
  }
});
