import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { useLanguage } from "../context/LanguageContext";
import { colors, fonts, spacing, type } from "../theme";

type Props = {
  onDone: () => void;
};

export function OnboardingScreen({ onDone }: Props) {
  const { t } = useLanguage();
  const [index, setIndex] = React.useState(0);
  const width = Dimensions.get("window").width;

  const slides = [
    { icon: "analytics-outline" as const, title: t.onb1Title, body: t.onb1Body },
    { icon: "trending-up-outline" as const, title: t.onb2Title, body: t.onb2Body },
    { icon: "wallet-outline" as const, title: t.onb3Title, body: t.onb3Body }
  ];
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={["rgba(183,245,61,0.22)", "rgba(124,158,255,0.12)", "rgba(7,7,12,0)"]}
        style={[styles.glow, { width: width * 1.1, height: width * 1.1 }]}
      />

      <View style={styles.topRow}>
        <Text style={styles.brand}>{t.appName}</Text>
        <AnimatedPressable haptic onPress={onDone} contentStyle={styles.skipBtn}>
          <Text style={styles.skipTxt}>{t.skip}</Text>
        </AnimatedPressable>
      </View>

      <View style={styles.hero}>
        <View style={styles.iconBubble}>
          <Ionicons name={slide.icon} size={42} color={colors.onAccent} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <AnimatedPressable
          haptic
          onPress={() => (isLast ? onDone() : setIndex(index + 1))}
          contentStyle={styles.cta}
        >
          <Text style={styles.ctaTxt}>{isLast ? t.getStarted : t.next}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onAccent} />
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl
  },
  glow: {
    position: "absolute",
    top: -140,
    right: -120,
    borderRadius: 999
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  brand: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.text
  },
  skipBtn: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)"
  },
  skipTxt: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textSecondary
  },
  hero: {
    flex: 1,
    justifyContent: "center"
  },
  iconBubble: {
    width: 86,
    height: 86,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 10 },
    marginBottom: spacing.xl
  },
  title: {
    ...type.hero,
    fontSize: 48,
    lineHeight: 54,
    marginBottom: spacing.lg
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary
  },
  footer: {
    gap: spacing.xl
  },
  dots: {
    flexDirection: "row",
    gap: 8
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderStrong
  },
  dotActive: {
    width: 26,
    backgroundColor: colors.accent
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    backgroundColor: colors.accent
  },
  ctaTxt: {
    fontFamily: fonts.extrabold,
    fontSize: 15,
    color: colors.onAccent
  }
});
