import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS, FONTS } from '../constants/theme';

export type TabName = 'home' | 'recent' | 'settings' | 'about';

interface NavItem {
  key: TabName;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',     label: 'Home',     icon: '🏠' },
  { key: 'recent',   label: 'Expenses', icon: '📋' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
  { key: 'about',    label: 'About',    icon: 'ℹ️' },
];

interface BottomNavBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.wrapper}>
      <View style={styles.pill}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabChange(item.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {item.icon}
              </Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 18,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 32,
    gap: 2,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  icon: {
    fontSize: 18,
  },
  iconActive: {
    // scale effect via parent bg change is enough
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONTS.medium,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: COLORS.background,
    fontFamily: FONTS.bold,
  },
});

export default BottomNavBar;
