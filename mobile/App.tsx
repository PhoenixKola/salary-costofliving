import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import mobileAds from "react-native-google-mobile-ads";
import { StatusBar } from "expo-status-bar";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts
} from "@expo-google-fonts/manrope";
import { DataProvider } from "./src/context/DataContext";
import { LanguageProvider } from "./src/context/LanguageContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { colors } from "./src/theme";

const ONBOARDING_KEY = "salary_costofliving_onboarding_v1";

function AppContent() {
  const [ready, setReady] = React.useState(false);
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((seen) => setShowOnboarding(seen !== "done"))
      .finally(() => setReady(true));
  }, []);

  const finishOnboarding = React.useCallback(() => {
    setShowOnboarding(false);
    AsyncStorage.setItem(ONBOARDING_KEY, "done").catch(() => {});
  }, []);

  if (!ready) return <LoadingScreen />;
  if (showOnboarding) return <OnboardingScreen onDone={finishOnboarding} />;
  return <RootNavigator />;
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold
  });

  React.useEffect(() => {
    if (Platform.OS === "android") {
      mobileAds().initialize().catch(() => {});
    }
  }, []);

  return (
    <LanguageProvider>
      <DataProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />
        {fontsLoaded ? <AppContent /> : <LoadingScreen />}
      </DataProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg
  }
});
