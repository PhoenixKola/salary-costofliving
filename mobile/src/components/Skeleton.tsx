import React from "react";
import { Animated, Easing, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { radii } from "../theme";

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Pulsing placeholder block for loading states. */
export function Skeleton({ width = "100%", height = 16, radius = radii.sm, style }: Props) {
  const opacity = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { width, height, borderRadius: radius, opacity }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(255,255,255,0.08)"
  }
});
