import React from "react";
import { Animated, Easing, StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { colors } from "../theme";

/**
 * Two soft radial-gradient blobs drifting slowly behind the content —
 * the ambient glow layer of the home hero.
 */
export function GlowBackground() {
  const { width } = useWindowDimensions();
  const drift1 = React.useRef(new Animated.Value(0)).current;
  const drift2 = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = (v: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        ])
      );
    const l1 = loop(drift1, 9000);
    const l2 = loop(drift2, 12000);
    l1.start();
    l2.start();
    return () => {
      l1.stop();
      l2.stop();
    };
  }, [drift1, drift2]);

  const size = width * 1.4;

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            top: -size * 0.45,
            left: -size * 0.25,
            transform: [
              { translateX: drift1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
              { translateY: drift1.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) }
            ]
          }
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="glow1" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.16} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow1)" />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.blob,
          {
            top: -size * 0.2,
            right: -size * 0.5,
            transform: [
              { translateX: drift2.interpolate({ inputRange: [0, 1], outputRange: [0, -36] }) },
              { translateY: drift2.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) }
            ]
          }
        ]}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="glow2" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={colors.chartAlt} stopOpacity={0.12} />
              <Stop offset="1" stopColor={colors.chartAlt} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#glow2)" />
        </Svg>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: "absolute"
  }
});
