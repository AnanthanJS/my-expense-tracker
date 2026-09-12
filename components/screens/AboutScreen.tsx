import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  IconCoin,
  IconChartBar,
  IconCalendar,
  IconTarget,
  IconSearch,
  IconDeviceFloppy,
  IconLock,
  IconHeart,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';
import appConfig from '../../app.json';
import { FONTS, SPACING, GUTTER } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavbarHeight } from '../../hooks/useNavbarHeight';

// (#30) All Tabler icons; reworded Rupee-first copy
const FEATURES: { icon: React.FC<IconProps>; title: string; desc: string }[] = [
  { icon: IconCoin,         title: 'Your currency',        desc: 'Currency of your choice, ₹ by default.' },
  { icon: IconChartBar,     title: 'Category Breakdown',   desc: 'Visual bar charts for each spending category.' },
  { icon: IconCalendar,     title: 'Monthly View',         desc: 'Browse past months and track trends over time.' },
  { icon: IconTarget,       title: 'Budget Goals',         desc: 'Set income & budget limits and monitor progress.' },
  { icon: IconSearch,       title: 'Smart Search',         desc: 'Quickly filter expenses by description or category.' },
  { icon: IconDeviceFloppy, title: 'Offline Storage',      desc: 'All data stored locally on your device, no sign-up needed.' },
];

const AboutScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const navbarHeight = useNavbarHeight(); // (#4)

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: navbarHeight }]}
      showsVerticalScrollIndicator={false}
    >
      {/* (#17) Tablet: cap at 640px, centered */}
      <View style={styles.maxWidthWrapper}>
        {/* Hero */}
        <View style={styles.hero}>
          {/* (#30) Replaced 💰 emoji with IconCoin */}
          <View style={[styles.appIconWrap, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <IconCoin size={40} color={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>My Expense Tracker</Text>
          <Text style={[styles.appVersion, { color: colors.textDim }]}>
            Version {appConfig.expo.version}  •  Built with React Native
          </Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            Your personal finance companion — simple, fast & private.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FEATURES</Text>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <View
                key={f.title}
                style={[styles.featureRow, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}
              >
                <View style={[styles.featureIconWrap, { backgroundColor: colors.surfaceLight }]}>
                  <Icon size={22} color={colors.primary} strokeWidth={1.5} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{f.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRIVACY</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={styles.privacyRow}>
              {/* (#30) Replaced 🔒 with IconLock */}
              <IconLock size={18} color={colors.textMuted} strokeWidth={1.5} style={{ marginTop: 1 }} />
              <Text style={[styles.privacyText, { color: colors.textMuted }]}>
                All your data stays on this device. No accounts, no cloud, no tracking.
                Your financial data is completely private.
              </Text>
            </View>
          </View>
        </View>

        {/* Credits */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>BUILT WITH</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            {['Expo & React Native', 'AsyncStorage', 'DM Sans (Google Fonts)', 'React Native Paper'].map((tech) => (
              <Text key={tech} style={[styles.techItem, { color: colors.textMuted }]}>• {tech}</Text>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {/* (#30) Replaced ❤️ emoji with IconHeart */}
          <IconHeart size={14} color={colors.textDim} strokeWidth={2} fill={colors.textDim} />
          <Text style={[styles.footerText, { color: colors.textDim }]}>Made for everyday budgeting</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    // (#3) GUTTER — was SPACING.lg (16), now 20
    padding: GUTTER,
    alignItems: 'stretch',
  },
  // (#17) Tablet: max 640px centered
  maxWidthWrapper: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  appIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    // (#11) ELEVATION on iOS was already elevation: 8; now consistent via inline for About only
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  techItem: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
});

export default React.memo(AboutScreen);
