import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useData } from "../context/DataContext";
import { useLanguage } from "../context/LanguageContext";
import { calcBudget, getWageSeries } from "../lib/calc";
import { fmtALL } from "../lib/format";
import type { BudgetScenario, City, Household, Lifestyle, SavedScenario } from "../types";
import { AnimatedPressable } from "../components/AnimatedPressable";
import { DonutChart } from "../components/DonutChart";
import { GlassCard } from "../components/GlassCard";
import { RentSheet } from "../components/RentSheet";
import { ScreenHeader } from "../components/ScreenHeader";
import { Segmented } from "../components/Segmented";
import { colors, fonts, spacing, TAB_BAR_CLEARANCE, type } from "../theme";

const BUDGET_KEY = "salary_costofliving_budget_v2";
const SCENARIOS_KEY = "salary_costofliving_scenarios_v1";

const CATEGORY_COLORS = {
  rent: colors.accent,
  food: colors.chartAlt,
  utilities: "#45D6A4",
  transport: "#FFC94D",
  other: "#FF8ACB"
} as const;

const DEFAULT_SCENARIO: BudgetScenario = {
  city: "Tirana",
  lifestyle: "Normal",
  household: 1,
  rent: 45000
};

export function BudgetScreen() {
  const { t } = useLanguage();
  const { payload } = useData();
  const [budget, setBudget] = React.useState<BudgetScenario>(DEFAULT_SCENARIO);
  const [saved, setSaved] = React.useState<SavedScenario[]>([]);
  const [rentOpen, setRentOpen] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.multiGet([BUDGET_KEY, SCENARIOS_KEY]).then((pairs) => {
      const current = pairs.find(([key]) => key === BUDGET_KEY)?.[1];
      const scenarios = pairs.find(([key]) => key === SCENARIOS_KEY)?.[1];
      if (current) setBudget(JSON.parse(current));
      if (scenarios) setSaved(JSON.parse(scenarios));
    });
  }, []);

  const persistBudget = React.useCallback((next: BudgetScenario) => {
    setBudget(next);
    AsyncStorage.setItem(BUDGET_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistSaved = React.useCallback((next: SavedScenario[]) => {
    setSaved(next);
    AsyncStorage.setItem(SCENARIOS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const result = React.useMemo(() => calcBudget(budget), [budget]);
  const wage = React.useMemo(() => {
    const wages = getWageSeries(payload);
    return wages.length ? wages[wages.length - 1].v : null;
  }, [payload]);
  const wagePct = wage && wage > 0 ? (result.total / wage) * 100 : null;

  const saveScenario = () => {
    const scenario: SavedScenario = {
      ...budget,
      id: `${Date.now()}`,
      total: result.total
    };
    persistSaved([scenario, ...saved].slice(0, 4));
  };

  const removeScenario = (id: string) => {
    persistSaved(saved.filter((s) => s.id !== id));
  };

  const categoryLabel = (key: string) => {
    if (key === "rent") return t.catRent;
    if (key === "food") return t.catFood;
    if (key === "utilities") return t.catUtilities;
    if (key === "transport") return t.catTransport;
    return t.catOther;
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title={t.budgetTitle} subtitle={t.budgetSubtitle} />

        <GlassCard glow>
          <Text style={styles.fieldLabel}>{t.city}</Text>
          <Segmented
            value={budget.city}
            onChange={(v) => persistBudget({ ...budget, city: v as City })}
            wrap
            minItemWidth={112}
            options={[
              { key: "Tirana", label: "Tirana", icon: "business-outline" },
              { key: "Durres", label: "Durres", icon: "boat-outline" },
              { key: "Vlore", label: "Vlore", icon: "sunny-outline" },
              { key: "Shkoder", label: "Shkoder", icon: "leaf-outline" },
              { key: "Other", label: t.other, icon: "ellipsis-horizontal" }
            ]}
          />

          <Text style={styles.fieldLabel}>{t.lifestyle}</Text>
          <Segmented
            value={budget.lifestyle}
            onChange={(v) => persistBudget({ ...budget, lifestyle: v as Lifestyle })}
            options={[
              { key: "Basic", label: t.basic, icon: "flash-outline" },
              { key: "Normal", label: t.normal, icon: "checkmark-circle-outline" },
              { key: "Comfort", label: t.comfort, icon: "diamond-outline" }
            ]}
          />

          <Text style={styles.fieldLabel}>{t.household}</Text>
          <Segmented
            value={String(budget.household)}
            onChange={(v) => persistBudget({ ...budget, household: Number(v) as Household })}
            options={[
              { key: "1", label: "1", icon: "person-outline" },
              { key: "2", label: "2", icon: "people-outline" },
              { key: "3", label: "3", icon: "people-outline" },
              { key: "4", label: "4", icon: "people-outline" }
            ]}
          />

          <Text style={styles.fieldLabel}>{t.rent}</Text>
          <AnimatedPressable haptic onPress={() => setRentOpen(true)} contentStyle={styles.rentButton}>
            <View>
              <Text style={styles.rentValue}>{fmtALL(budget.rent)} ALL</Text>
              <Text style={styles.rentHint}>{t.rentSheetSub}</Text>
            </View>
            <Ionicons name="create-outline" size={20} color={colors.accent} />
          </AnimatedPressable>
        </GlassCard>

        <GlassCard>
          <View style={styles.breakdownHeader}>
            <View>
              <Text style={type.h2}>{t.breakdownTitle}</Text>
              <Text style={styles.subtle}>
                {wagePct !== null ? `${wagePct.toFixed(0)}% ${t.ofAvgWage}` : t.totalPerMonth}
              </Text>
            </View>
            <DonutChart
              size={132}
              strokeWidth={15}
              centerLabel={t.totalPerMonth}
              centerValue={fmtALL(result.total)}
              slices={result.categories.map((c) => ({
                value: c.amount,
                color: CATEGORY_COLORS[c.key]
              }))}
            />
          </View>

          <View style={styles.categoryList}>
            {result.categories.map((c) => (
              <View key={c.key} style={styles.categoryRow}>
                <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[c.key] }]} />
                <Text style={styles.categoryName}>{categoryLabel(c.key)}</Text>
                <Text style={styles.categoryValue}>{fmtALL(c.amount)} ALL</Text>
              </View>
            ))}
          </View>

          <AnimatedPressable haptic onPress={saveScenario} contentStyle={styles.saveButton}>
            <Ionicons name="add-circle" size={18} color={colors.onAccent} />
            <Text style={styles.saveText}>{t.saveScenario}</Text>
          </AnimatedPressable>
        </GlassCard>

        <GlassCard>
          <Text style={type.h2}>{t.savedScenarios}</Text>
          {saved.length === 0 ? (
            <Text style={styles.empty}>{t.compareHint}</Text>
          ) : (
            <View style={styles.savedList}>
              {saved.map((s) => (
                <View key={s.id} style={styles.savedRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedTitle}>
                      {s.city} · {s.lifestyle} · {s.household}
                    </Text>
                    <Text style={styles.savedSub}>
                      {fmtALL(s.rent)} ALL {t.rent.toLowerCase()}
                    </Text>
                  </View>
                  <Text style={styles.savedTotal}>{fmtALL(s.total)} ALL</Text>
                  <AnimatedPressable haptic onPress={() => removeScenario(s.id)} contentStyle={styles.removeBtn}>
                    <Ionicons name="close" size={16} color={colors.textMuted} />
                  </AnimatedPressable>
                </View>
              ))}
            </View>
          )}
        </GlassCard>
      </ScrollView>

      <RentSheet
        visible={rentOpen}
        title={t.rentSheetTitle}
        subtitle={t.rentSheetSub}
        doneLabel={t.done}
        value={budget.rent}
        onChange={(rent) => persistBudget({ ...budget, rent })}
        onClose={() => setRentOpen(false)}
      />
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
  fieldLabel: {
    fontFamily: fonts.extrabold,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    textTransform: "uppercase"
  },
  rentButton: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  rentValue: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.text,
    letterSpacing: -0.5
  },
  rentHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  breakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  subtle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4
  },
  categoryList: { marginTop: spacing.lg, gap: spacing.md },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textSecondary
  },
  categoryValue: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text
  },
  saveButton: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: colors.accent
  },
  saveText: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: colors.onAccent
  },
  empty: {
    marginTop: spacing.sm,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted
  },
  savedList: { marginTop: spacing.md, gap: spacing.sm },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  savedTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text
  },
  savedSub: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2
  },
  savedTotal: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: colors.accent
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)"
  }
});
