import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { colors, radii } from "../theme";

const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : "ca-app-pub-2653462201538649/2513886493";

/**
 * Inline ad placed at the bottom of scrollable screens (Trends/Settings),
 * framed like any other card so it blends with the dark UI instead of
 * anchoring every screen.
 */
export function AdSlot() {
  if (Platform.OS !== "android") return null;

  return (
    <View style={styles.frame}>
      <BannerAd unitId={AD_UNIT_ID} size={BannerAdSize.INLINE_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    overflow: "hidden",
    minHeight: 60
  }
});
