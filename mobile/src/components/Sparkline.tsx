import React from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop, Circle } from "react-native-svg";
import { colors } from "../theme";
import { areaPath, scalePoints, smoothPath } from "./chartPath";

type Props = {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
  strokeWidth?: number;
  endDot?: boolean;
};

let gradientSeq = 0;

/** Tiny inline line chart, optionally with a soft gradient area fill. */
export function Sparkline({
  values,
  width = 96,
  height = 32,
  color = colors.accent,
  filled = true,
  strokeWidth = 2,
  endDot = true
}: Props) {
  const gradId = React.useRef(`spark-${gradientSeq++}`).current;
  if (values.length < 2) return <View style={{ width, height }} />;

  const pts = scalePoints(values, width - strokeWidth * 2, height - strokeWidth * 2, 2).map(
    (p) => ({ x: p.x + strokeWidth, y: p.y + strokeWidth })
  );
  const last = pts[pts.length - 1];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.28} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {filled ? <Path d={areaPath(pts, height)} fill={`url(#${gradId})`} /> : null}
      <Path
        d={smoothPath(pts)}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {endDot ? <Circle cx={last.x} cy={last.y} r={2.5} fill={color} /> : null}
    </Svg>
  );
}
