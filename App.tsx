import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';

import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';

import { COLORS, FONTS } from './constants/theme';
import {
  Expense,
  Settings,
  loadExpenses,
  saveExpenses,
  loadSettings,
  saveSettings,
  defaultSettings,
} from './utils/storage';

import BottomNavBar, { TabName } from './components/BottomNavBar';
import HomeScreen from './components/screens/HomeScreen';
import RecentExpensesScreen from './components/screens/RecentExpensesScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import AboutScreen from './components/screens/AboutScreen';

SplashScreen.preventAutoHideAsync();

const TAB_TITLES: Record<TabName, string> = {
  home:     'My Expense Tracker',
  recent:   'Recent Expenses',
  settings: 'Settings',
  about:    'About',
};

const TAB_SUBTITLES: Record<TabName, string> = {
  home:     'Track spending & stay on budget',
  recent:   'All your transactions',
  settings: 'Customise your experience',
  about:    'App info & features',
};

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  const [expenses, setExpenses]         = useState<Expense[]>([]);
  const [settings, setSettings]         = useState<Settings>(defaultSettings);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading]       = useState(true);
  const [activeTab, setActiveTab]       = useState<TabName>('home');

  // Load data
  useEffect(() => {
    async function prepare() {
      try {
        const [loadedExpenses, loadedSettings] = await Promise.all([
          loadExpenses(),
          loadSettings(),
        ]);
        setExpenses(loadedExpenses);
        setSettings(loadedSettings);
      } catch (e) {
        console.warn(e);
      } finally {
        setIsLoading(false);
      }
    }
    prepare();
  }, []);

  // Hide splash screen immediately so it never gets stuck
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleAddExpense = async (newExp: Omit<Expense, 'id'>) => {
    const expense: Expense = { ...newExp, id: Date.now().toString() };
    const updatedExpenses = [expense, ...expenses];
    setExpenses(updatedExpenses);
    await saveExpenses(updatedExpenses);
  };

  const handleDeleteExpense = async (id: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    await saveExpenses(updatedExpenses);
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            expenses={expenses}
            settings={settings}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onAddExpense={handleAddExpense}
          />
        );
      case 'recent':
        return (
          <RecentExpensesScreen
            expenses={expenses}
            currency={settings.currency}
            onDelete={handleDeleteExpense}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onSave={handleSaveSettings}
          />
        );
      case 'about':
        return <AboutScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>{TAB_TITLES[activeTab]}</Text>
          <Text style={styles.appSubtitle}>{TAB_SUBTITLES[activeTab]}</Text>
        </View>
        {/* Currency badge */}
        <View style={styles.currencyBadge}>
          <Text style={styles.currencyText}>{settings.currency}</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>

      {/* Floating Bottom Pill Navbar */}
      <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  appTitle: {
    color: COLORS.primary,
    fontSize: 22,
    fontFamily: FONTS.bold,
  },
  appSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  currencyBadge: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  currencyText: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  screenContainer: {
    flex: 1,
  },
});
