import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radii } from "../theme";

/** Slim inline pill shown when the app is serving cached data. */
export function OfflineToast({ message }: { message: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name="cloud-offline-outline" size={14} color={colors.warning} />
      <Text style={styles.txt}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.warningDim,
    borderWidth: 1,
    borderColor: "rgba(255,201,77,0.25)"
  },
  txt: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.warning
  }
});
