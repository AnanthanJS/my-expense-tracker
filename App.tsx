import React, { useCallback, useEffect, Suspense, lazy, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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
import ErrorBoundary from './components/ErrorBoundary';
import AddExpenseSheet from './components/AddExpenseSheet';

const DashboardScreen    = lazy(() => import('./components/screens/HomeScreen'));
const AnalyticsScreen    = lazy(() => import('./components/screens/AnalyticsScreen'));
const BudgetTabScreen    = lazy(() => import('./components/screens/BudgetTabScreen'));
const MoreTabScreen      = lazy(() => import('./components/screens/MoreTabScreen'));

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

const ScreenFallback = () => {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
};

// Placeholder component for the Add tab (never actually rendered — FAB intercepts)
const AddPlaceholder = () => null;

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { isLoading, feedback, hideFeedback } = useApp();
  const [isAddSheetVisible, setAddSheetVisible] = useState(false);

  const handleOpenAddSheet = useCallback(() => setAddSheetVisible(true), []);
  const handleCloseAddSheet = useCallback(() => setAddSheetVisible(false), []);

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
        tabBar={(props) => (
          <BottomNavBar
            {...props}
            onAddPress={handleOpenAddSheet}
          />
        )}
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
          lazy: true,
        }}
      >
        <Tab.Screen name="Dashboard">
          {() => (
            <Suspense fallback={<ScreenFallback />}>
              <DashboardScreen />
            </Suspense>
          )}
        </Tab.Screen>

        <Tab.Screen name="Analytics">
          {() => (
            <Suspense fallback={<ScreenFallback />}>
              <AnalyticsScreen />
            </Suspense>
          )}
        </Tab.Screen>

        <Tab.Screen
          name="Add"
          component={AddPlaceholder}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              handleOpenAddSheet();
            },
          }}
        />

        <Tab.Screen name="Budget">
          {() => (
            <Suspense fallback={<ScreenFallback />}>
              <BudgetTabScreen />
            </Suspense>
          )}
        </Tab.Screen>

        <Tab.Screen name="More">
          {() => (
            <Suspense fallback={<ScreenFallback />}>
              <MoreTabScreen />
            </Suspense>
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <AddExpenseSheet
        visible={isAddSheetVisible}
        onClose={handleCloseAddSheet}
      />

      <Snackbar
        visible={feedback.visible}
        onDismiss={hideFeedback}
        duration={3000}
        style={{
          backgroundColor: feedback.type === 'error' ? colors.danger : colors.surfaceElevated,
          marginBottom: 110,
          borderRadius: 12,
        }}
        theme={{
          colors: {
            inverseOnSurface: feedback.type === 'error' ? '#FFF' : colors.text,
            inversePrimary: colors.primary,
          },
        }}
        action={{ label: 'Dismiss', onPress: hideFeedback }}
      >
        {feedback.message}
      </Snackbar>
    </View>
  );
}

function ThemedApp() {
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
            border: colors.border,
            notification: colors.secondary,
          },
          fonts: Platform.select({
            default: {
              regular: { fontFamily: FONTS.regular, fontWeight: '400' },
              medium:  { fontFamily: FONTS.medium,  fontWeight: '500' },
              bold:    { fontFamily: FONTS.bold,    fontWeight: '700' },
              heavy:   { fontFamily: FONTS.bold,    fontWeight: '900' },
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
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppProvider>
            <ThemedApp />
          </AppProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
