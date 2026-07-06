import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "./AnimatedPressable";
import { colors, fonts, radii, spacing } from "../theme";

type Props = {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  detail?: string | null;
};

export function ErrorState({ title, subtitle, actionLabel, onAction, detail }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Ionicons name="cloud-offline-outline" size={26} color={colors.textSecondary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{subtitle}</Text>
      <AnimatedPressable onPress={onAction} haptic style={styles.btnOuter} contentStyle={styles.btn}>
        <Ionicons name="refresh" size={17} color={colors.onAccent} style={{ marginRight: 8 }} />
        <Text style={styles.btnTxt}>{actionLabel}</Text>
      </AnimatedPressable>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 19,
    color: colors.text,
    marginBottom: 6
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl
  },
  btnOuter: {},
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    backgroundColor: colors.accent
  },
  btnTxt: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: colors.onAccent
  },
  detail: {
    marginTop: spacing.lg,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center"
  }
});
