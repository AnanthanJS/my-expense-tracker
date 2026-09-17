import React, { useCallback, useEffect, Suspense, lazy, useState } from 'react';
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
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';

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
  Settings:  { title: 'Settings', subtitle: 'Customise your experience' },
  About:     { title: 'About',    subtitle: 'App info & features' },
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
    <MainHeader title={TAB_CONFIG.Home.title} showMonth />
    <HomeScreen />
  </Suspense>
);

const ExpensesWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Expenses.title} showMonth />
    <RecentExpensesScreen />
  </Suspense>
);

const AnalyticsWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Analytics.title} showMonth />
    <AnalyticsScreen />
  </Suspense>
);

interface SettingsWithHeaderProps {
  pendingRouteName?: string | null;
  onUnsavedChangesChange?: (hasChanges: boolean) => void;
  onClearPendingRoute?: () => void;
}

const SettingsWithHeader: React.FC<SettingsWithHeaderProps> = (props) => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Settings.title} subtitle={TAB_CONFIG.Settings.subtitle} />
    <SettingsScreen {...props} />
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
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);
  const [pendingSettingsRoute, setPendingSettingsRoute] = useState<string | null>(null);
  const navbarHeight = useNavbarHeight(); // (#4) replaces hardcoded marginBottom: 100

  const clearPendingSettingsRoute = useCallback(() => {
    setPendingSettingsRoute(null);
  }, []);

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
        tabBar={(props) => (
          <BottomNavBar
            {...props}
            hasUnsavedSettings={hasUnsavedSettings}
            onUnsavedSettingsNavigation={setPendingSettingsRoute}
          />
        )}
        initialRouteName="Home"
        screenOptions={({ route }) => ({
          // The unsaved-settings guard lived only in BottomNavBar.handlePress,
          // so swiping away from Settings discarded edits silently. The pager
          // reads `swipeEnabled` from the *focused* route's options
          // (MaterialTopTabView.js:66), so this locks the gesture only while
          // Settings is focused and dirty — every other tab still swipes.
          // The sticky "Save All Changes" bar is on screen whenever this is
          // true, so the lock has a visible cause.
          swipeEnabled: route.name === 'Settings' ? !hasUnsavedSettings : true,
          lazy: true,
          lazyPlaceholder: () => <ScreenFallback />,
        })}
      >
        <Tab.Screen name="Home" component={HomeWithHeader} />
        <Tab.Screen name="Expenses" component={ExpensesWithHeader} />
        <Tab.Screen name="Analytics" component={AnalyticsWithHeader} />
        <Tab.Screen name="Settings">
          {() => (
            <SettingsWithHeader
              pendingRouteName={pendingSettingsRoute}
              onUnsavedChangesChange={setHasUnsavedSettings}
              onClearPendingRoute={clearPendingSettingsRoute}
            />
          )}
        </Tab.Screen>
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

export default function App() {
  const [fontsLoaded] = useFonts({
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

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
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
