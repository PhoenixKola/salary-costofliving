import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { PillTabBar, type TabMeta } from "./PillTabBar";
import { HomeScreen } from "../screens/HomeScreen";
import { TrendsScreen } from "../screens/TrendsScreen";
import { BudgetScreen } from "../screens/BudgetScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { useLanguage } from "../context/LanguageContext";
import { colors } from "../theme";

export type RootTabParamList = {
  Home: undefined;
  Trends: undefined;
  Budget: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    border: colors.border,
    primary: colors.accent,
    text: colors.text
  }
};

export function RootNavigator() {
  const { t } = useLanguage();

  const meta: Record<string, TabMeta> = {
    Home: { icon: "home-outline", iconActive: "home", label: t.tabHome },
    Trends: { icon: "trending-up-outline", iconActive: "trending-up", label: t.tabTrends },
    Budget: { icon: "wallet-outline", iconActive: "wallet", label: t.tabBudget },
    Settings: { icon: "settings-outline", iconActive: "settings", label: t.tabSettings }
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.bg }
        }}
        tabBar={(props) => <PillTabBar {...props} meta={meta} />}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Trends" component={TrendsScreen} />
        <Tab.Screen name="Budget" component={BudgetScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
