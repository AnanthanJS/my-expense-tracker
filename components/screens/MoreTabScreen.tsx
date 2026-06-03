import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import IconPigMoney from '@tabler/icons-react-native/dist/esm/icons/IconPigMoney'
import IconSearch from '@tabler/icons-react-native/dist/esm/icons/IconSearch'
import IconRefresh from '@tabler/icons-react-native/dist/esm/icons/IconRefresh'
import IconCalendar from '@tabler/icons-react-native/dist/esm/icons/IconCalendar'
import IconArrowLeft from '@tabler/icons-react-native/dist/esm/icons/IconArrowLeft'
import IconChevronRight from '@tabler/icons-react-native/dist/esm/icons/IconChevronRight'
import IconSparkles from '@tabler/icons-react-native/dist/esm/icons/IconSparkles'
import { useAppTheme } from '../../hooks/useAppTheme'
import { useApp } from '../../context/AppContext'
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme'
import { Bill } from '../../utils/storage'

import SavingsGoalsScreen from './SavingsGoalsScreen'
import SearchScreen from './SearchScreen'
import RecurringPaymentsScreen from './RecurringPaymentsScreen'
import BillCalendarScreen from './BillCalendarScreen'
import BillDetailScreen from './BillDetailScreen'

type MoreScreen = 'hub' | 'savings' | 'search' | 'recurring' | 'bills' | 'billDetail'

interface FeatureCard {
  key: MoreScreen
  title: string
  subtitle: string
  Icon: React.ComponentType<any>
  gradientFrom: string
  gradientTo: string
  accentColor: string
}

// ─── Hub Feature Cards ────────────────────────────────────────────────────────
const HubScreen: React.FC<{
  colors: any
  isDark: boolean
  onNavigate: (screen: MoreScreen) => void
  settings: any
  expenses: any[]
  savingsGoals: any[]
  recurringPayments: any[]
  bills: any[]
}> = ({ colors, isDark, onNavigate, settings, expenses, savingsGoals, recurringPayments, bills }) => {
  const currency = settings.currency || '$'

  const totalSaved = savingsGoals.reduce((s: number, g: any) => s + g.current, 0)
  const totalMonthlyRecurring = recurringPayments.reduce((s: number, p: any) => {
    const mult: Record<string, number> = { weekly: 52 / 12, monthly: 1, quarterly: 1 / 3, yearly: 1 / 12 }
    return s + p.amount * (mult[p.frequency] ?? 1)
  }, 0)
  const nextBill = bills.length > 0
    ? [...bills].sort((a: any, b: any) => a.dueDay - b.dueDay)[0]
    : null
  const today = new Date()

  const cards: FeatureCard[] = [
    {
      key: 'savings',
      title: 'Savings Goals',
      subtitle: `${currency}${totalSaved.toLocaleString(undefined, { maximumFractionDigits: 0 })} saved across ${savingsGoals.length} goal${savingsGoals.length !== 1 ? 's' : ''}`,
      Icon: IconPigMoney,
      gradientFrom: '#10B981',
      gradientTo: '#059669',
      accentColor: '#10B981',
    },
    {
      key: 'search',
      title: 'Search',
      subtitle: `Browse ${expenses.length} transaction${expenses.length !== 1 ? 's' : ''} & filter by category`,
      Icon: IconSearch,
      gradientFrom: '#3B82F6',
      gradientTo: '#2563EB',
      accentColor: '#3B82F6',
    },
    {
      key: 'recurring',
      title: 'Recurring',
      subtitle: `${currency}${totalMonthlyRecurring.toFixed(0)}/mo · ${recurringPayments.length} payment${recurringPayments.length !== 1 ? 's' : ''}`,
      Icon: IconRefresh,
      gradientFrom: '#7C3AED',
      gradientTo: '#6D28D9',
      accentColor: '#7C3AED',
    },
    {
      key: 'bills',
      title: 'Bill Calendar',
      subtitle: nextBill
        ? `Next: ${nextBill.name} on day ${nextBill.dueDay}`
        : `${bills.length} bill${bills.length !== 1 ? 's' : ''} tracked`,
      Icon: IconCalendar,
      gradientFrom: '#F59E0B',
      gradientTo: '#D97706',
      accentColor: '#F59E0B',
    },
  ]

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.hubScroll}>
      {/* Greeting */}
      <View style={styles.hubHeader}>
        <View style={[styles.hubIconBg, { backgroundColor: colors.primary + '20' }]}>
          <IconSparkles size={22} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.hubTitle, { color: colors.text }]}>More Features</Text>
          <Text style={[styles.hubSub, { color: colors.textMuted }]}>
            {settings.userName ? `Hi ${settings.userName}!` : 'Explore tools'} · Tap a card to get started
          </Text>
        </View>
      </View>

      {/* 2x2 Grid */}
      <View style={styles.cardGrid}>
        {cards.map(card => (
          <TouchableOpacity
            key={card.key}
            style={[styles.featureCard, { backgroundColor: colors.surface }, SHADOWS.md]}
            onPress={() => onNavigate(card.key)}
            activeOpacity={0.85}
          >
            {/* Colored top area */}
            <View style={[styles.cardTop, { backgroundColor: card.accentColor }]}>
              <View style={[styles.cardIconWrap, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <card.Icon size={28} color="#fff" />
              </View>
              {/* Decorative circles */}
              <View style={[styles.cardCircle1, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
              <View style={[styles.cardCircle2, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
            </View>

            {/* Card body */}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{card.title}</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textMuted }]} numberOfLines={2}>
                {card.subtitle}
              </Text>
              <View style={styles.cardArrow}>
                <Text style={[styles.cardOpenText, { color: card.accentColor }]}>Open</Text>
                <IconChevronRight size={14} color={card.accentColor} />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.surface }, SHADOWS.sm]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{savingsGoals.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Goals</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>{expenses.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Expenses</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>{recurringPayments.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Recurring</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>{bills.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>Bills</Text>
        </View>
      </View>

      <View style={{ height: 120 }} />
    </ScrollView>
  )
}

// ─── Sub-screen wrapper with back bar ────────────────────────────────────────
interface SubScreenWrapperProps {
  title: string
  accentColor: string
  onBack: () => void
  children: React.ReactNode
  colors: any
}

const SubScreenWrapper: React.FC<SubScreenWrapperProps> = ({ title, accentColor, onBack, children, colors }) => (
  <View style={{ flex: 1 }}>
    <View style={[styles.subTopBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} style={styles.subBackBtn}>
        <IconArrowLeft size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.subTopTitle, { color: colors.text }]}>{title}</Text>
      <View style={{ width: 38 }} />
    </View>
    {children}
  </View>
)

// ─── Main Tab Screen ──────────────────────────────────────────────────────────
const MoreTabScreen: React.FC = () => {
  const { colors, isDark } = useAppTheme()
  const { expenses, settings, savingsGoals, recurringPayments, bills } = useApp()

  const [currentScreen, setCurrentScreen] = useState<MoreScreen>('hub')
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  const navigate = (screen: MoreScreen) => setCurrentScreen(screen)
  const goBack = () => {
    if (currentScreen === 'billDetail') setCurrentScreen('bills')
    else setCurrentScreen('hub')
  }

  const handleSelectBill = (bill: Bill) => {
    setSelectedBill(bill)
    setCurrentScreen('billDetail')
  }

  if (currentScreen === 'hub') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HubScreen
          colors={colors}
          isDark={isDark}
          onNavigate={navigate}
          settings={settings}
          expenses={expenses}
          savingsGoals={savingsGoals}
          recurringPayments={recurringPayments}
          bills={bills}
        />
      </View>
    )
  }

  if (currentScreen === 'savings') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SubScreenWrapper title="Savings Goals" accentColor="#10B981" onBack={goBack} colors={colors}>
          <SavingsGoalsScreen />
        </SubScreenWrapper>
      </View>
    )
  }

  if (currentScreen === 'search') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SubScreenWrapper title="Search" accentColor="#3B82F6" onBack={goBack} colors={colors}>
          <SearchScreen />
        </SubScreenWrapper>
      </View>
    )
  }

  if (currentScreen === 'recurring') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SubScreenWrapper title="Recurring Payments" accentColor="#7C3AED" onBack={goBack} colors={colors}>
          <RecurringPaymentsScreen />
        </SubScreenWrapper>
      </View>
    )
  }

  if (currentScreen === 'bills') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SubScreenWrapper title="Bill Calendar" accentColor="#F59E0B" onBack={goBack} colors={colors}>
          <BillCalendarScreen onSelectBill={handleSelectBill} />
        </SubScreenWrapper>
      </View>
    )
  }

  if (currentScreen === 'billDetail' && selectedBill) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <BillDetailScreen bill={selectedBill} onBack={goBack} />
      </View>
    )
  }

  // Fallback
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HubScreen
        colors={colors}
        isDark={isDark}
        onNavigate={navigate}
        settings={settings}
        expenses={expenses}
        savingsGoals={savingsGoals}
        recurringPayments={recurringPayments}
        bills={bills}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hub
  hubScroll: { padding: SPACING.lg },
  hubHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.xl },
  hubIconBg: {
    width: 44, height: 44, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  hubTitle: { fontFamily: FONTS.bold, fontSize: 22 },
  hubSub: { fontFamily: FONTS.regular, fontSize: 13, marginTop: 2 },

  cardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginBottom: SPACING.lg },
  featureCard: {
    width: '47.5%', borderRadius: RADIUS.xl, overflow: 'hidden',
  },
  cardTop: {
    height: 100, padding: SPACING.md, justifyContent: 'flex-end',
    overflow: 'hidden', position: 'relative',
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardCircle1: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    top: -20, right: -20,
  },
  cardCircle2: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    top: 10, right: 30,
  },
  cardBody: { padding: SPACING.md, gap: 4 },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 14 },
  cardSubtitle: { fontFamily: FONTS.regular, fontSize: 11, lineHeight: 15 },
  cardArrow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  cardOpenText: { fontFamily: FONTS.medium, fontSize: 12 },

  statsBar: {
    flexDirection: 'row', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: FONTS.bold, fontSize: 20 },
  statLabel: { fontFamily: FONTS.regular, fontSize: 11 },
  statDivider: { width: 1, height: 32, marginHorizontal: SPACING.xs },

  // Sub-screen
  subTopBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl, paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  subBackBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
  subTopTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 18 },
})

export default React.memo(MoreTabScreen)
