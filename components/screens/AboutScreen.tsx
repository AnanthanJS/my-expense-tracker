import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import appConfig from '../../app.json';
import { FONTS, SPACING } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';

const FEATURES = [
  { icon: '₹', title: 'Rupee-first', desc: 'Built for Indian users with ₹ as default currency.' },
  { icon: '📊', title: 'Category Breakdown', desc: 'Visual bar charts for each spending category.' },
  { icon: '📅', title: 'Monthly View', desc: 'Browse past months and track trends over time.' },
  { icon: '🎯', title: 'Budget Goals', desc: 'Set income & budget limits and monitor progress.' },
  { icon: '🔍', title: 'Smart Search', desc: 'Quickly filter expenses by description or category.' },
  { icon: '💾', title: 'Offline Storage', desc: 'All data stored locally on your device, no sign-up needed.' },
];

const AboutScreen: React.FC = () => {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.appIconWrap, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
          <Text style={styles.appIconEmoji}>💰</Text>
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>My Expense Tracker</Text>
        <Text style={[styles.appVersion, { color: colors.textDim }]}>Version {appConfig.expo.version}  •  Built with React Native</Text>
        <Text style={[styles.tagline, { color: colors.textMuted }]}>
          Your personal finance companion — simple, fast &amp; private.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FEATURES</Text>
        {FEATURES.map((f) => (
          <View key={f.title} style={[styles.featureRow, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.surfaceLight }]}>
              <Text style={styles.featureIconText}>{f.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRIVACY</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceLight }]}>
          <Text style={[styles.privacyText, { color: colors.textMuted }]}>
            🔒  All your data stays on this device. No accounts, no cloud, no tracking.
            Your financial data is completely private.
          </Text>
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

      <Text style={[styles.footer, { color: colors.textDim }]}>Made with ❤️ for everyday budgeting</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: SPACING.lg,
    paddingBottom: 120,
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
    elevation: 8,
  },
  appIconEmoji: {
    fontSize: 38,
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
    fontSize: 11,
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
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: { fontSize: 18 },
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
  privacyText: {
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
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
});

export default React.memo(AboutScreen);
