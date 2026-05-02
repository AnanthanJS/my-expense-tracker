import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { COLORS, FONTS } from '../../constants/theme';

const FEATURES = [
  { icon: '₹', title: 'Rupee-first', desc: 'Built for Indian users with ₹ as default currency.' },
  { icon: '📊', title: 'Category Breakdown', desc: 'Visual bar charts for each spending category.' },
  { icon: '📅', title: 'Monthly View', desc: 'Browse past months and track trends over time.' },
  { icon: '🎯', title: 'Budget Goals', desc: 'Set income & budget limits and monitor progress.' },
  { icon: '🔍', title: 'Smart Search', desc: 'Quickly filter expenses by description or category.' },
  { icon: '💾', title: 'Offline Storage', desc: 'All data stored locally on your device, no sign-up needed.' },
];

const AboutScreen: React.FC = () => {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.appIconWrap}>
          <Text style={styles.appIconEmoji}>💰</Text>
        </View>
        <Text style={styles.appName}>My Expense Tracker</Text>
        <Text style={styles.appVersion}>Version 1.0.0  •  Built with React Native</Text>
        <Text style={styles.tagline}>
          Your personal finance companion — simple, fast &amp; private.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FEATURES</Text>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>{f.icon}</Text>
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PRIVACY</Text>
        <View style={styles.card}>
          <Text style={styles.privacyText}>
            🔒  All your data stays on this device. No accounts, no cloud, no tracking.
            Your financial data is completely private.
          </Text>
        </View>
      </View>

      {/* Credits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BUILT WITH</Text>
        <View style={styles.card}>
          {['Expo & React Native', 'AsyncStorage', 'DM Sans (Google Fonts)', 'Lucide Icons'].map((tech) => (
            <Text key={tech} style={styles.techItem}>• {tech}</Text>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Made with ❤️ for everyday budgeting</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: 20,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appIconEmoji: {
    fontSize: 38,
  },
  appName: {
    color: COLORS.primary,
    fontSize: 24,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  appVersion: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginBottom: 10,
  },
  tagline: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconText: { fontSize: 18 },
  featureText: { flex: 1 },
  featureTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 2,
  },
  featureDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    gap: 6,
  },
  privacyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  techItem: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  footer: {
    color: COLORS.textDim,
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
});

export default AboutScreen;
