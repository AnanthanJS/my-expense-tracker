import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import IconBell from '@tabler/icons-react-native/dist/esm/icons/IconBell';
import IconAlertTriangle from '@tabler/icons-react-native/dist/esm/icons/IconAlertTriangle';
import IconReceipt2 from '@tabler/icons-react-native/dist/esm/icons/IconReceipt2';
import IconPigMoney from '@tabler/icons-react-native/dist/esm/icons/IconPigMoney';
import IconInfoCircle from '@tabler/icons-react-native/dist/esm/icons/IconInfoCircle';
import IconCheck from '@tabler/icons-react-native/dist/esm/icons/IconCheck';
import IconTrash from '@tabler/icons-react-native/dist/esm/icons/IconTrash';
import { useApp } from '../../context/AppContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import type { AppNotification } from '../../utils/storage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getGroup(timestamp: string): 'today' | 'week' | 'older' {
  const now = new Date();
  const then = new Date(timestamp);
  const diffDays = Math.floor((now.getTime() - then.getTime()) / 86400000);
  if (diffDays < 1) return 'today';
  if (diffDays < 7) return 'week';
  return 'older';
}

// ─── Notification Icon ────────────────────────────────────────────────────────

interface NotifIconProps {
  type: AppNotification['type'];
  colors: ReturnType<typeof useAppTheme>['colors'];
}

const NotifIcon: React.FC<NotifIconProps> = ({ type, colors }) => {
  const config: Record<AppNotification['type'], { icon: React.ReactNode; bg: string }> = {
    transaction: {
      icon: <IconReceipt2 size={18} color={colors.info} strokeWidth={2} />,
      bg: colors.info + '20',
    },
    budget_warning: {
      icon: <IconAlertTriangle size={18} color={colors.warning} strokeWidth={2} />,
      bg: colors.warning + '20',
    },
    bill_due: {
      icon: <IconBell size={18} color={colors.danger} strokeWidth={2} />,
      bg: colors.danger + '20',
    },
    savings: {
      icon: <IconPigMoney size={18} color={colors.success} strokeWidth={2} />,
      bg: colors.success + '20',
    },
    info: {
      icon: <IconInfoCircle size={18} color={colors.textMuted} strokeWidth={2} />,
      bg: colors.surfaceLight,
    },
  };

  const { icon, bg } = config[type] ?? config.info;

  return (
    <View style={[styles.notifIconCircle, { backgroundColor: bg }]}>
      {icon}
    </View>
  );
};

// ─── Notification Item ────────────────────────────────────────────────────────

interface NotifItemProps {
  notif: AppNotification;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onTap: (id: string) => void;
  onLongPress: (id: string, title: string) => void;
}

const NotifItem: React.FC<NotifItemProps> = ({ notif, colors, onTap, onLongPress }) => (
  <TouchableOpacity
    style={[
      styles.notifItem,
      { backgroundColor: notif.read ? colors.surface : colors.surfaceElevated, borderColor: colors.border },
      !notif.read && { borderLeftWidth: 3, borderLeftColor: colors.primary },
    ]}
    onPress={() => onTap(notif.id)}
    onLongPress={() => onLongPress(notif.id, notif.title)}
    delayLongPress={400}
    activeOpacity={0.82}
  >
    <NotifIcon type={notif.type} colors={colors} />

    <View style={styles.notifContent}>
      <Text style={[styles.notifTitle, { color: colors.text }]} numberOfLines={1}>
        {notif.title}
      </Text>
      <Text style={[styles.notifBody, { color: colors.textMuted }]} numberOfLines={2}>
        {notif.body}
      </Text>
      <Text style={[styles.notifTime, { color: colors.textDim }]}>
        {formatTimeAgo(notif.timestamp)}
      </Text>
    </View>

    {!notif.read && (
      <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
    )}
  </TouchableOpacity>
);

// ─── Group Header ─────────────────────────────────────────────────────────────

const GroupHeader: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={styles.groupHeader}>
    <Text style={[styles.groupLabel, { color }]}>{label}</Text>
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    clearNotifications,
  } = useApp();
  const { colors } = useAppTheme();

  const grouped = useMemo(() => {
    const today: AppNotification[] = [];
    const week: AppNotification[] = [];
    const older: AppNotification[] = [];

    notifications.forEach((n) => {
      const g = getGroup(n.timestamp);
      if (g === 'today') today.push(n);
      else if (g === 'week') week.push(n);
      else older.push(n);
    });

    return { today, week, older };
  }, [notifications]);

  const handleTap = useCallback(
    (id: string) => {
      markNotificationRead(id);
    },
    [markNotificationRead]
  );

  const handleLongPress = useCallback(
    (id: string, title: string) => {
      Alert.alert('Delete Notification', `Remove "${title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(id) },
      ]);
    },
    [deleteNotification]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear All', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: clearNotifications },
    ]);
  }, [clearNotifications]);

  const hasNotifications = notifications.length > 0;

  // ── Empty State ──
  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceLight }]}>
        <IconBell size={48} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
        No notifications yet. We'll let you know when something needs your attention.
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { backgroundColor: colors.surfaceLight }]}
            onPress={markAllNotificationsRead}
            activeOpacity={0.8}
          >
            <IconCheck size={14} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!hasNotifications ? (
          <EmptyState />
        ) : (
          <>
            {/* Today */}
            {grouped.today.length > 0 && (
              <>
                <GroupHeader label="Today" color={colors.textMuted} />
                {grouped.today.map((n) => (
                  <NotifItem
                    key={n.id}
                    notif={n}
                    colors={colors}
                    onTap={handleTap}
                    onLongPress={handleLongPress}
                  />
                ))}
              </>
            )}

            {/* This Week */}
            {grouped.week.length > 0 && (
              <>
                <GroupHeader label="This Week" color={colors.textMuted} />
                {grouped.week.map((n) => (
                  <NotifItem
                    key={n.id}
                    notif={n}
                    colors={colors}
                    onTap={handleTap}
                    onLongPress={handleLongPress}
                  />
                ))}
              </>
            )}

            {/* Older */}
            {grouped.older.length > 0 && (
              <>
                <GroupHeader label="Older" color={colors.textMuted} />
                {grouped.older.map((n) => (
                  <NotifItem
                    key={n.id}
                    notif={n}
                    colors={colors}
                    onTap={handleTap}
                    onLongPress={handleLongPress}
                  />
                ))}
              </>
            )}

            {/* Clear All */}
            <TouchableOpacity
              style={[styles.clearAllBtn, { borderColor: colors.danger + '50' }]}
              onPress={handleClearAll}
              activeOpacity={0.8}
            >
              <IconTrash size={16} color={colors.danger} strokeWidth={2} />
              <Text style={[styles.clearAllText, { color: colors.danger }]}>Clear All Notifications</Text>
            </TouchableOpacity>

            <Text style={[styles.longPressHint, { color: colors.textDim }]}>
              Long-press a notification to delete it
            </Text>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 26, fontFamily: FONTS.bold, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, fontFamily: FONTS.regular, marginTop: 2 },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  markAllText: { fontSize: 12, fontFamily: FONTS.bold },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg },

  // Group
  groupHeader: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  groupLabel: {
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Notification Item
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontFamily: FONTS.bold, marginBottom: 2 },
  notifBody: { fontSize: 13, fontFamily: FONTS.regular, lineHeight: 19, marginBottom: 4 },
  notifTime: { fontSize: 11, fontFamily: FONTS.regular },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginTop: 6,
    flexShrink: 0,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    marginTop: SPACING.xxxl,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTitle: { fontSize: 20, fontFamily: FONTS.bold, marginBottom: SPACING.sm },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Clear all
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  clearAllText: { fontSize: 14, fontFamily: FONTS.bold },
  longPressHint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
});

export default React.memo(NotificationsScreen);
