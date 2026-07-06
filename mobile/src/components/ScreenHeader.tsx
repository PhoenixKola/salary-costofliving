import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, type } from "../theme";

type Props = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function ScreenHeader({ title, subtitle, right }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={type.h1}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12
  },
  left: { flex: 1, gap: 4 },
  sub: {
    fontFamily: type.body.fontFamily,
    fontSize: 13,
    color: colors.textMuted
  }
});
