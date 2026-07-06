import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "../theme";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  padded?: boolean;
};

/** Dark glassy card: subtle top-light gradient sheen + hairline border. */
export function GlassCard({ children, style, glow = false, padded = true }: Props) {
  return (
    <View style={[styles.wrap, glow && styles.glow, style]}>
      <LinearGradient
        colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0.02)"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.inner, padded && styles.padded]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    overflow: "hidden"
  },
  glow: {
    borderColor: colors.accentBorder,
    shadowColor: colors.accent,
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6
  },
  inner: {
    borderRadius: radii.lg
  },
  padded: {
    padding: spacing.lg
  }
});
