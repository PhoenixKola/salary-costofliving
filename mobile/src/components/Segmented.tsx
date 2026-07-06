import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, fonts, radii } from "../theme";

type Option = { key: string; label: string; icon?: keyof typeof Ionicons.glyphMap };

type Props = {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  wrap?: boolean;
  minItemWidth?: number;
};

export function Segmented({ options, value, onChange, wrap = false, minItemWidth }: Props) {
  return (
    <View style={[styles.row, wrap ? styles.wrap : styles.noWrap]}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <AnimatedPressable
            key={o.key}
            onPress={() => onChange(o.key)}
            haptic
            scaleIn={0.97}
            style={[styles.itemOuter, wrap && minItemWidth ? { minWidth: minItemWidth } : null]}
            contentStyle={[styles.item, active && styles.itemActive]}
          >
            {o.icon ? (
              <Ionicons
                name={o.icon}
                size={15}
                color={active ? colors.onAccent : colors.textMuted}
                style={styles.icon}
              />
            ) : null}
            <Text numberOfLines={1} style={[styles.label, active && styles.labelActive]}>
              {o.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  wrap: { flexWrap: "wrap" },
  noWrap: { flexWrap: "nowrap" },
  itemOuter: { flexGrow: 1, minWidth: 0 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)"
  },
  itemActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  icon: { marginRight: 7 },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textSecondary
  },
  labelActive: {
    color: colors.onAccent
  }
});
