import React, { useCallback, useEffect, Suspense, lazy, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Provider as PaperProvider, Snackbar } from 'react-native-paper';
import { SafeAreaProvider, useSafeAreaInsets, initialWindowMetrics } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

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

const TAB_CONFIG = {
  Home:     { title: 'My Expense Tracker', subtitle: 'Track spending & stay on budget' },
  Expenses: { title: 'Recent Expenses',    subtitle: 'All your transactions' },
  Settings: { title: 'Settings',           subtitle: 'Customise your experience' },
  About:    { title: 'About',              subtitle: 'App info & features' },
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
    <MainHeader title={TAB_CONFIG.Home.title} subtitle={TAB_CONFIG.Home.subtitle} />
    <HomeScreen />
  </Suspense>
);

const ExpensesWithHeader = () => (
  <Suspense fallback={<ScreenFallback />}>
    <MainHeader title={TAB_CONFIG.Expenses.title} subtitle={TAB_CONFIG.Expenses.subtitle} />
    <RecentExpensesScreen />
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
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
          lazyPlaceholder: () => <ScreenFallback />,
        }}
      >
        <Tab.Screen name="Home" component={HomeWithHeader} />
        <Tab.Screen name="Expenses" component={ExpensesWithHeader} />
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
        duration={3000}
        style={{
          backgroundColor: feedback.type === 'error' ? colors.danger : colors.surface,
          marginBottom: 100,
        }}
        theme={{
          colors: {
            inverseOnSurface: feedback.type === 'error' ? colors.background : colors.text,
            inversePrimary: colors.primary,
          },
        }}
        action={{
          label: 'Dismiss',
          onPress: hideFeedback,
        }}
      >
        {feedback.message}
      </Snackbar>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const { isDark, colors, paperTheme } = useAppTheme();

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
          <PaperProvider theme={paperTheme}>
            <AppProvider>
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
                      regular: { fontFamily: FONTS.regular, fontWeight: '400' },
                      medium: { fontFamily: FONTS.medium, fontWeight: '500' },
                      bold: { fontFamily: FONTS.bold, fontWeight: '700' },
                      heavy: { fontFamily: FONTS.bold, fontWeight: '900' },
                    }
                  })
                }}>
                  <AppContent />
                </NavigationContainer>
              </View>
            </AppProvider>
          </PaperProvider>
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
