import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { colors, fonts, radii } from "../theme";

export type TabMeta = {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
};

type Props = BottomTabBarProps & {
  meta: Record<string, TabMeta>;
};

/** Floating glass pill replacing the stock tab bar. */
export function PillTabBar({ state, navigation, meta }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.holder, { bottom: Math.max(insets.bottom, 10) + 6 }]} pointerEvents="box-none">
      <View style={styles.pill}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const m = meta[route.name];
          if (!m) return null;

          const onPress = () => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <AnimatedPressable
              key={route.key}
              onPress={onPress}
              scaleIn={0.92}
              style={styles.itemOuter}
              contentStyle={[styles.item, focused && styles.itemActive]}
            >
              <Ionicons
                name={focused ? m.iconActive : m.icon}
                size={21}
                color={focused ? colors.onAccent : colors.textMuted}
              />
              {focused ? (
                <Text style={styles.label} numberOfLines={1}>
                  {m.label}
                </Text>
              ) : null}
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  holder: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center"
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16
  },
  itemOuter: {},
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    height: 46,
    minWidth: 46,
    paddingHorizontal: 13,
    borderRadius: radii.pill,
    justifyContent: "center"
  },
  itemActive: {
    backgroundColor: colors.accent
  },
  label: {
    fontFamily: fonts.extrabold,
    fontSize: 13,
    color: colors.onAccent
  }
});
