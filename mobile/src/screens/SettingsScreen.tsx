import React from "react";
import { Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DATA_URL, useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../types";
import { formatGenerated } from "../lib/format";
import { AdSlot } from "../components/AdSlot";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { GlassCard } from "../components/GlassCard";
import { ScreenHeader } from "../components/ScreenHeader";
import { Segmented } from "../components/Segmented";
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, type } from "../theme";

const PRIVACY_URL = "https://github.com/PhoenixKola/salary-costofliving/blob/main/privacy-policy.md";

function SettingsRow({
  icon,
  label,
  value,
  onPress
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <AnimatedPressable haptic onPress={onPress} scaleIn={0.98}>
      {content}
    </AnimatedPressable>
  );
}

export function SettingsScreen() {
  const { lang, setLang, t } = useLanguage();
  const { payload, cachedMode } = useData();
  const version = Constants.expoConfig?.version ?? "1.0.0";
  const updated = formatGenerated(payload?.generatedAt, lang);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.settingsTitle} subtitle={t.appTagline} />

        <GlassCard>
          <Text style={type.h2}>{t.language}</Text>
          <View style={{ marginTop: spacing.md }}>
            <Segmented
              value={lang}
              onChange={(v) => setLang(v as Language)}
              options={[
                { key: "sq", label: t.albanian, icon: "chatbubble-ellipses-outline" },
                { key: "en", label: t.english, icon: "language-outline" }
              ]}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={type.h2}>{t.dataSection}</Text>
          <View style={styles.sectionRows}>
            <SettingsRow icon="server-outline" label={t.dataSource} value={t.dataSourceValue} />
            <SettingsRow
              icon={cachedMode ? "cloud-offline-outline" : "pulse-outline"}
              label={t.lastUpdated}
              value={`${cachedMode ? t.cached : t.live} · ${updated}`}
            />
            <SettingsRow icon="open-outline" label={t.openRaw} onPress={() => Linking.openURL(DATA_URL)} />
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={type.h2}>{t.aboutSection}</Text>
          <View style={styles.sectionRows}>
            <SettingsRow icon="phone-portrait-outline" label={t.version} value={version} />
            <SettingsRow icon="share-outline" label={t.shareApp} onPress={() => Share.share({ message: t.shareMessage })} />
            <SettingsRow icon="star-outline" label={t.rateApp} />
            <SettingsRow icon="shield-checkmark-outline" label={t.privacyPolicy} onPress={() => Linking.openURL(PRIVACY_URL)} />
          </View>
        </GlassCard>

        <AdSlot />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: TAB_BAR_CLEARANCE,
    gap: spacing.md
  },
  sectionRows: { marginTop: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder
  },
  rowLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text
  },
  rowValue: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  }
});
