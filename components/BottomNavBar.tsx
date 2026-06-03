import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IconLayoutDashboard from '@tabler/icons-react-native/dist/esm/icons/IconLayoutDashboard';
import IconChartBar from '@tabler/icons-react-native/dist/esm/icons/IconChartBar';
import IconPlus from '@tabler/icons-react-native/dist/esm/icons/IconPlus';
import IconTarget from '@tabler/icons-react-native/dist/esm/icons/IconTarget';
import IconApps from '@tabler/icons-react-native/dist/esm/icons/IconApps';
import type { IconProps } from '@tabler/icons-react-native';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useApp } from '../context/AppContext';

interface NavItem {
  key: string;
  label: string;
  icon: React.FC<IconProps>;
  routeName: string;
  isAdd?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Home',     icon: IconLayoutDashboard, routeName: 'Dashboard' },
  { key: 'analytics', label: 'Analytics',icon: IconChartBar,        routeName: 'Analytics' },
  { key: 'add',       label: '',         icon: IconPlus,            routeName: 'Add', isAdd: true },
  { key: 'budget',    label: 'Budget',   icon: IconTarget,          routeName: 'Budget' },
  { key: 'more',      label: 'More',     icon: IconApps,            routeName: 'More' },
];

interface BottomNavBarProps extends BottomTabBarProps {
  onAddPress: () => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  state,
  navigation,
  onAddPress,
}) => {
  const { colors } = useAppTheme();
  const { unreadCount } = useApp();
  const insets = useSafeAreaInsets();

  const bottomOffset = Platform.select({
    ios: Math.max(insets.bottom, SPACING.lg),
    android: insets.bottom > 0 ? insets.bottom + SPACING.sm : SPACING.lg,
    default: SPACING.lg,
  });

  const handlePress = useCallback((item: NavItem, index: number) => {
    if (item.isAdd) {
      onAddPress();
      return;
    }
    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[index]?.key,
      canPreventDefault: true,
    });
    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(item.routeName);
    }
  }, [navigation, state, onAddPress]);

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View style={[
        styles.pill,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: colors.primary,
        },
      ]}>
        {NAV_ITEMS.map((item, index) => {
          if (item.isAdd) {
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.fabContainer]}
                onPress={() => handlePress(item, index)}
                activeOpacity={0.85}
                accessibilityLabel="Add expense"
                accessibilityRole="button"
              >
                <View style={[styles.fab, { backgroundColor: colors.primary, ...SHADOWS.md }]}>
                  <IconPlus size={26} color="#FFFFFF" strokeWidth={2.5} />
                </View>
              </TouchableOpacity>
            );
          }

          const isActive = state.index === index;
          const Icon = item.icon;
          const showBadge = item.routeName === 'Budget' && unreadCount > 0;

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tab}
              onPress={() => handlePress(item, index)}
              activeOpacity={0.7}
              accessibilityLabel={`${item.label} tab`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconWrap}>
                <View style={[
                  styles.iconBg,
                  isActive && { backgroundColor: colors.primary + '20' },
                ]}>
                  <Icon
                    size={22}
                    color={isActive ? colors.primary : colors.textDim}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {showBadge && (
                    <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={[
                styles.label,
                {
                  color: isActive ? colors.primary : colors.textDim,
                  fontFamily: isActive ? FONTS.bold : FONTS.regular,
                },
              ]}>
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
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    maxWidth: '96%',
    minWidth: 320,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 14,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: SPACING.xs,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 40,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: FONTS.bold,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: SPACING.sm,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
});

export default React.memo(BottomNavBar);
