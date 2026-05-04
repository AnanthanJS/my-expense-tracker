import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  IconHome, 
  IconReceipt2, 
  IconSettings, 
  IconInfoCircle,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import { FONTS, SPACING } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

export type TabName = 'home' | 'recent' | 'settings' | 'about';

interface NavItem {
  key: TabName;
  label: string;
  icon: React.FC<IconProps>;
  routeName: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',     label: 'Home',     icon: IconHome,         routeName: 'Home' },
  { key: 'recent',   label: 'Expenses', icon: IconReceipt2,     routeName: 'Expenses' },
  { key: 'settings', label: 'Settings', icon: IconSettings,     routeName: 'Settings' },
  { key: 'about',    label: 'About',    icon: IconInfoCircle,   routeName: 'About' },
];

const PILL_PADDING = 8;
const TAB_GAP = 4;

interface BottomNavBarProps extends MaterialTopTabBarProps {
  hasUnsavedSettings: boolean;
  onUnsavedSettingsNavigation: (routeName: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  state,
  navigation,
  position,
  hasUnsavedSettings,
  onUnsavedSettingsNavigation,
}) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const currentRouteName = state.routeNames[state.index];
  
  const [containerWidth, setContainerWidth] = useState(0);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const handlePress = useCallback((routeName: string) => {
    const targetRoute = state.routes.find((route) => route.name === routeName);
    const event = navigation.emit({
      type: 'tabPress',
      target: targetRoute?.key,
      canPreventDefault: true,
    });

    if (currentRouteName === 'Settings' && routeName !== 'Settings' && hasUnsavedSettings) {
      onUnsavedSettingsNavigation(routeName);
      return;
    }

    if (currentRouteName !== routeName && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }, [currentRouteName, hasUnsavedSettings, navigation, onUnsavedSettingsNavigation, state.routes]);

  const numTabs = state.routes.length;
  const usableWidth = containerWidth - (PILL_PADDING * 2) - (TAB_GAP * (numTabs - 1));
  const tabWidth = containerWidth > 0 ? usableWidth / numTabs : 0;

  const translateX = position.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * (tabWidth + TAB_GAP)),
  });

  const bottomOffset = Platform.select({
    ios: Math.max(insets.bottom, SPACING.lg),
    android: insets.bottom > 0 ? insets.bottom + SPACING.sm : SPACING.lg,
    default: SPACING.lg,
  });

  return (
    <View style={[styles.wrapper, { bottom: bottomOffset }]}>
      <View 
        style={[styles.pill, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
        onLayout={handleLayout}
        accessible={true}
        accessibilityRole="tablist"
      >
        {tabWidth > 0 && (
          <Animated.View 
            style={[
              styles.animatedPill, 
              { 
                backgroundColor: colors.primary,
                width: tabWidth,
                transform: [{ translateX }]
              },
            ]} 
          />
        )}
        
        {NAV_ITEMS.map((item, index) => {
          const isActive = state.index === index;
          const Icon = item.icon;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tab}
              onPress={() => handlePress(item.routeName)}
              activeOpacity={0.7}
              accessibilityLabel={`${item.label} tab`}
              accessibilityHint={`Navigates to ${item.label} screen`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Icon 
                size={22} 
                color={isActive ? colors.background : colors.textMuted} 
                strokeWidth={2}
              />
              <Text style={[
                styles.label, 
                { 
                  color: isActive ? colors.background : colors.textMuted,
                  fontFamily: isActive ? FONTS.bold : FONTS.medium 
                }
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
    borderRadius: 40,
    paddingVertical: 8,
    paddingHorizontal: PILL_PADDING,
    alignItems: 'center',
    gap: TAB_GAP,
    borderWidth: 1,
    position: 'relative',
    maxWidth: '94%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  animatedPill: {
    position: 'absolute',
    left: PILL_PADDING,
    top: 8,
    bottom: 8,
    borderRadius: 32,
    zIndex: 0,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 32,
    gap: 4,
    zIndex: 1,
    minWidth: 78,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});

export default React.memo(BottomNavBar);
