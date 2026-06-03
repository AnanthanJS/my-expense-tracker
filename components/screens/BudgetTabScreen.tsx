import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONTS, SPACING, RADIUS } from '../../constants/theme';
import BudgetGoalsScreen from './BudgetGoalsScreen';
import NotificationsScreen from './NotificationsScreen';
import ProfileScreen from './ProfileScreen';
import { useApp } from '../../context/AppContext';
import IconTarget from '@tabler/icons-react-native/dist/esm/icons/IconTarget';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell';
import IconUser from '@tabler/icons-react-native/dist/esm/icons/IconUser';

// ─── Types ────────────────────────────────────────────────────────────────────

type BudgetScreen = 'goals' | 'notifications' | 'profile';

interface TabItem {
  key: BudgetScreen;
  label: string;
  icon: (active: boolean, color: string, inactiveColor: string) => React.ReactNode;
}

const TABS: TabItem[] = [
  {
    key: 'goals',
    label: 'Goals',
    icon: (active, color, inactiveColor) => (
      <IconTarget size={20} color={active ? color : inactiveColor} strokeWidth={active ? 2.5 : 1.8} />
    ),
  },
  {
    key: 'notifications',
    label: 'Alerts',
    icon: (active, color, inactiveColor) => (
      <IconBell size={20} color={active ? color : inactiveColor} strokeWidth={active ? 2.5 : 1.8} />
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: (active, color, inactiveColor) => (
      <IconUser size={20} color={active ? color : inactiveColor} strokeWidth={active ? 2.5 : 1.8} />
    ),
  },
];

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

interface TabBarProps {
  active: BudgetScreen;
  onChange: (tab: BudgetScreen) => void;
  unreadCount: number;
  colors: ReturnType<typeof useAppTheme>['colors'];
}

const TabBar: React.FC<TabBarProps> = ({ active, onChange, unreadCount, colors }) => (
  <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
    {TABS.map((tab) => {
      const isActive = active === tab.key;
      return (
        <TouchableOpacity
          key={tab.key}
          style={styles.tabItem}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.75}
        >
          {/* Icon with optional badge */}
          <View style={styles.tabIconWrap}>
            {tab.icon(isActive, colors.primary, colors.textDim)}
            {/* Unread badge on Alerts tab */}
            {tab.key === 'notifications' && unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </View>

          {/* Label */}
          <Text
            style={[
              styles.tabLabel,
              { color: isActive ? colors.primary : colors.textDim },
              isActive && { fontFamily: FONTS.bold },
            ]}
          >
            {tab.label}
          </Text>

          {/* Active indicator pill */}
          {isActive && (
            <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Main Tab Screen ──────────────────────────────────────────────────────────

const BudgetTabScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { unreadCount } = useApp();
  const [currentScreen, setCurrentScreen] = useState<BudgetScreen>('goals');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'goals':
        return <BudgetGoalsScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'profile':
        return <ProfileScreen />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TabBar
        active={currentScreen}
        onChange={setCurrentScreen}
        unreadCount={unreadCount}
        colors={colors}
      />
      <View style={styles.screenContainer}>
        {renderScreen()}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.xs,
    position: 'relative',
  },
  tabIconWrap: {
    position: 'relative',
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -SPACING.sm,
    left: '50%',
    marginLeft: -14,
    width: 28,
    height: 3,
    borderTopLeftRadius: RADIUS.full,
    borderTopRightRadius: RADIUS.full,
  },

  // Badge
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FONTS.bold,
    color: '#FFFFFF',
    lineHeight: 14,
  },

  // Screen Container
  screenContainer: {
    flex: 1,
  },
});

export default React.memo(BudgetTabScreen);
