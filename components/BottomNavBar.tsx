import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  IconHome,
  IconReceipt2,
  IconSettings,
  IconInfoCircle,
  IconChartPie,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import { FONTS, SPACING, ELEVATION, GLASS, TEXT, RADII } from '../constants/theme';
import { SPRING } from '../constants/motion';
import { useAppTheme } from '../hooks/useAppTheme';
import { useReduceMotion } from '../hooks/useMotion';
import PressableScale from './PressableScale';

export type TabName = 'home' | 'recent' | 'analytics' | 'settings' | 'about';

interface NavItem {
  key: TabName;
  label: string;
  icon: React.FC<IconProps>;
  routeName: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'home',      label: 'Home',      icon: IconHome,       routeName: 'Home' },
  { key: 'recent',    label: 'Expenses',  icon: IconReceipt2,   routeName: 'Expenses' },
  { key: 'analytics', label: 'Analytics', icon: IconChartPie,   routeName: 'Analytics' },
  { key: 'settings',  label: 'Settings',  icon: IconSettings,   routeName: 'Settings' },
  { key: 'about',     label: 'About',     icon: IconInfoCircle, routeName: 'About' },
];

const PILL_PADDING = 8;
const TAB_GAP = 4;
/** How far the icon of a newly selected tab overshoots before settling. */
const ICON_POP = 1.08;

interface TabIconProps {
  Icon: React.FC<IconProps>;
  isActive: boolean;
  color: string;
}

/**
 * The tab icon, which gives a small kick the moment its tab becomes active.
 *
 * Only the icon moves, not the label or the pill: the pill is already tracking
 * the pager position gesture-for-gesture, so anything else animating the same
 * horizontal travel would be a second opinion on where the tab is.
 */
const TabIcon: React.FC<TabIconProps> = ({ Icon, isActive, color }) => {
  const scale = useSharedValue(1);
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (!isActive || reduceMotion) return;
    scale.value = withSequence(
      withSpring(ICON_POP, SPRING.press),
      withSpring(1, SPRING.gentle),
    );
  }, [isActive, reduceMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Reanimated.View style={animatedStyle}>
      <Icon size={22} color={color} strokeWidth={2} />
    </Reanimated.View>
  );
};

const BottomNavBar: React.FC<MaterialTopTabBarProps> = ({
  state,
  navigation,
  position,
}) => {
  const { colors, isDark } = useAppTheme();
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

    // (A7) The Settings unsaved-changes interception is gone: Settings now
    // saves as you edit, so there is nothing to lose by navigating away.
    if (currentRouteName !== routeName && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  }, [currentRouteName, navigation, state.routes]);

  const numTabs = state.routes.length;
  /**
   * (#2) Tabs are `flex: 1`, so the computed width has to match what flexbox
   * actually produces or the highlight drifts further off-centre with each tab.
   *
   * `onLayout` measures the inner row, which already sits inside the bar's
   * horizontal padding — so only the gaps come off here. Subtracting the
   * padding again made every tab 3.2px too narrow and left the last tab's
   * highlight ~13px adrift, which is what showed up as the content sitting
   * off-centre inside the pill.
   */
  const usableWidth = containerWidth - (TAB_GAP * (numTabs - 1));
  const tabWidth = containerWidth > 0 ? usableWidth / numTabs : 0;

  /**
   * Driven by the pager's own position rather than by `state.index`, so the
   * pill follows a swipe under the finger instead of jumping once the gesture
   * has already finished. That is why this one animation stays on react-native
   * Animated: `position` is an Animated.Node handed to us by the navigator.
   */
  const translateX = position.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * (tabWidth + TAB_GAP)),
  });

  const bottomOffset = Math.max(insets.bottom, SPACING.sm);

  const glass = isDark ? GLASS.dark : GLASS.light;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: glass.border,
          paddingBottom: bottomOffset,
        },
      ]}
    >
      <View
        style={styles.row}
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
                transform: [{ translateX }],
              },
            ]}
          />
        )}

        {NAV_ITEMS.map((item, index) => {
          const isActive = state.index === index;
          const Icon = item.icon;

          return (
            <PressableScale
              key={item.key}
              // (#2) flex: 1 replaces minWidth: 78 so computed and actual tab widths agree
              style={styles.tab}
              onPress={() => handlePress(item.routeName)}
              accessibilityLabel={`${item.label} tab`}
              accessibilityHint={`Navigates to ${item.label} screen`}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <TabIcon
                Icon={Icon}
                isActive={isActive}
                color={isActive ? colors.onPrimary : colors.textMuted}
              />
              {/*
                5 tabs at maxWidth 94% leave ~54px per tab on a 320dp screen,
                and "Analytics" measures ~52px at 10px — it wrapped to two
                lines, growing the pill while the highlight stayed one line
                tall. Lock to one line and let it shrink instead.
              */}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                maxFontSizeMultiplier={1.2}
                style={[
                  styles.label,
                  {
                    color: isActive ? colors.onPrimary : colors.textMuted,
                    fontFamily: isActive ? FONTS.text.semibold : FONTS.text.medium,
                  },
                ]}
              >
                {item.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    paddingHorizontal: PILL_PADDING,
    ...ELEVATION.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TAB_GAP,
    position: 'relative',
  },
  animatedPill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: RADII.md,
    zIndex: 0,
  },
  tab: {
    // (#2) flex: 1 instead of minWidth: 78 — tabs share equal width by construction
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADII.md,
    gap: 4,
    zIndex: 1,
  },
  label: {
    // TEXT.tabLabel — the documented sub-11px exception; see theme.ts
    ...TEXT.tabLabel,
    textAlign: 'center',
    width: '100%',
  },
});

export default React.memo(BottomNavBar);
