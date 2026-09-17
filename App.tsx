import React, { useEffect, Suspense, lazy, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavbarHeight } from './hooks/useNavbarHeight';

import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Provider as PaperProvider, Snackbar } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
/*
  Imported per weight, not from the package root. The root index `require()`s
  every weight including italics, and Metro cannot tree-shake that — so a root
  import bundled all 26 TTFs (6.5 MB) when 10 (2.3 MB) are used. Fewer assets
  is also less that can fail at load time.
*/
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { Sora_400Regular } from '@expo-google-fonts/sora/400Regular';
import { Sora_500Medium } from '@expo-google-fonts/sora/500Medium';
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { Sora_800ExtraBold } from '@expo-google-fonts/sora/800ExtraBold';

import { FONTS } from './constants/theme';
import { AppProvider, useApp } from './context/AppContext';
import { useAppTheme } from './hooks/useAppTheme';

import BottomNavBar from './components/BottomNavBar';
import MainHeader from './components/MainHeader';
import ErrorBoundary from './components/ErrorBoundary';

// Standard Lazy Imports (Bundler handles the .default mapping)
const HomeScreen           = lazy(() => import('./components/screens/HomeScreen'));
const RecentExpensesScreen = lazy(() => import('./components/screens/RecentExpensesScreen'));
const SettingsScreen       = lazy(() => import('./components/screens/SettingsScreen'));
const AboutScreen          = lazy(() => import('./components/screens/AboutScreen'));

SplashScreen.preventAutoHideAsync();

const Tab = createMaterialTopTabNavigator();

const AnalyticsScreen      = lazy(() => import('./components/screens/AnalyticsScreen'));

// (C1) The three data screens show the selected month in the header instead
// of a static strapline; only Settings and About keep a subtitle.
const TAB_CONFIG = {
  Home:      { title: 'Expense Tracker' },
  Expenses:  { title: 'Expenses' },
  Analytics: { title: 'Analytics' },
  About:     { title: 'About', subtitle: 'App info & features' },
};

const ScreenFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ThemedActivityIndicator />
  </View>
);

const ThemedActivityIndicator = () => {
  const { colors } = useAppTheme();
  return <ActivityIndicator size="small" color={colors.primary} />;
};

const HomeWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Home.title} />
    <HomeScreen />
  </Suspense>
);

const ExpensesWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Expenses.title} />
    <RecentExpensesScreen />
  </Suspense>
);

const AnalyticsWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Analytics.title} />
    <AnalyticsScreen />
  </Suspense>
);

/*
  No MainHeader here: the redesigned Settings screen renders its own large
  title alongside the auto-save indicator, which is the usual pattern for a
  settings page and is what the design calls for.
*/
const SettingsWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <SettingsScreen />
  </Suspense>
);

const AboutWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.About.title} subtitle={TAB_CONFIG.About.subtitle} />
    <AboutScreen />
  </Suspense>
);

function AppContent() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isLoading, feedback, hideFeedback } = useApp();
  const navbarHeight = useNavbarHeight(); // (#4) replaces hardcoded marginBottom: 100

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Tab.Navigator
        tabBarPosition="bottom"
        tabBar={(props) => <BottomNavBar {...props} />}
        initialRouteName="Home"
        screenOptions={{
          // (A7) The Settings swipe guard is gone with manual saving: settings
          // now persist as they are edited, so leaving mid-edit loses nothing.
          swipeEnabled: true,
          lazy: true,
          lazyPlaceholder: () => <ScreenFallback />,
        }}
      >
        <Tab.Screen name="Home" component={HomeWithHeader} />
        <Tab.Screen name="Expenses" component={ExpensesWithHeader} />
        <Tab.Screen name="Analytics" component={AnalyticsWithHeader} />
        <Tab.Screen name="Settings" component={SettingsWithHeader} />
        <Tab.Screen name="About" component={AboutWithHeader} />
      </Tab.Navigator>

      <Snackbar
        visible={feedback.visible}
        onDismiss={hideFeedback}
        duration={feedback.onUndo ? 5000 : 3000}
        style={{
          backgroundColor: feedback.type === 'error' ? colors.danger : colors.surface,
          marginBottom: navbarHeight,
        }}
        theme={{
          colors: {
            inverseOnSurface: feedback.type === 'error' ? colors.background : colors.text,
            inversePrimary: colors.primary,
          },
        }}
        action={feedback.onUndo ? {
          label: 'Undo',
          onPress: () => {
            feedback.onUndo?.();
            hideFeedback();
          },
        } : {
          label: 'Dismiss',
          onPress: hideFeedback,
        }}
      >
        {feedback.message}
      </Snackbar>
    </View>
  );
}

/**
 * Everything theme-aware lives in here, inside AppProvider — the theme now
 * depends on a persisted setting, so the provider has to be above it.
 */
function ThemedRoot() {
  const { isDark, colors, paperTheme } = useAppTheme();

  return (
    <PaperProvider theme={paperTheme}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor="transparent"
          translucent
        />
        <NavigationContainer theme={{
          dark: isDark,
          colors: {
            primary: colors.primary,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.surfaceLight,
            notification: colors.accent,
          },
          fonts: Platform.select({
            default: {
              regular: { fontFamily: FONTS.text.regular, fontWeight: '400' },
              medium: { fontFamily: FONTS.text.medium, fontWeight: '500' },
              bold: { fontFamily: FONTS.text.bold, fontWeight: '700' },
              heavy: { fontFamily: FONTS.text.extrabold, fontWeight: '800' },
            }
          })
        }}>
          <AppContent />
        </NavigationContainer>
      </View>
    </PaperProvider>
  );
}

/**
 * Longest we will hold the splash waiting for fonts. Past this we start the
 * app anyway — a slow or broken font load should cost us the typography, not
 * the entire app.
 */
const FONT_TIMEOUT_MS = 5000;

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    // Text (Inter) — everything that gets read
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    // Display (Sora) — titles and hero numbers
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  const [fontTimedOut, setFontTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  /**
   * `useFonts` loads the whole map through a single `loadAsync`, so ONE font
   * rejecting rejects the lot: `loaded` then stays false permanently and only
   * `error` is set (expo-font FontHooks.js). Gating render on `loaded` alone —
   * with the error discarded — meant any single font failure left the splash
   * up forever with no way out and nothing logged.
   *
   * Proceed on success, on failure, or on timeout. React Native falls back to
   * the system font for any family that did not load, so a failure degrades
   * the typography instead of bricking startup.
   */
  const isReady = fontsLoaded || fontError !== null || fontTimedOut;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  useEffect(() => {
    if (fontError) {
      console.warn('[fonts] load failed, continuing with system fallback:', fontError);
    }
  }, [fontError]);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <ThemedRoot />
          </AppProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
