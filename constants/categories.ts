import {
  IconToolsKitchen2,
  IconReceipt,
  IconBus,
  IconGasStation,
  IconHeart,
  IconShoppingBag,
  IconMovie,
  IconRefresh,
  IconCash,
  IconTrendingUp,
  IconShieldCheck,
  IconDots,
} from '@tabler/icons-react-native';
import type { IconProps } from '@tabler/icons-react-native';

/**
 * Category grouping and iconography for the Settings redesign.
 *
 * Groups are presentation only — they decide which section a category is
 * listed under and which tint its icon tile gets. Nothing in the expense data
 * model depends on them, so a category with no stored group simply falls into
 * "Uncategorised" rather than breaking.
 */
export const CATEGORY_GROUPS = ['Essentials', 'Lifestyle', 'Money & protection'] as const;
export type CategoryGroup = (typeof CATEGORY_GROUPS)[number];

/** Where ungrouped categories are listed. Not offered as a choice. */
export const UNGROUPED_LABEL = 'Uncategorised';

/**
 * Tile tints per group. These are accent hues rather than the app's primary,
 * so a long list stays scannable without every tile looking the same.
 * `[foreground, background]`, background applied at low alpha.
 */
export const GROUP_TINTS: Record<string, { fg: string; bg: string }> = {
  Essentials: { fg: '#2563eb', bg: '#2563eb1f' },
  Lifestyle: { fg: '#db2777', bg: '#db27771f' },
  'Money & protection': { fg: '#0f766e', bg: '#0f766e1f' },
  [UNGROUPED_LABEL]: { fg: '#64748b', bg: '#64748b1f' },
};

/** Icon per built-in category name, matched case-insensitively. */
const CATEGORY_ICONS: Record<string, React.FC<IconProps>> = {
  food: IconToolsKitchen2,
  bills: IconReceipt,
  transport: IconBus,
  fuel: IconGasStation,
  health: IconHeart,
  shopping: IconShoppingBag,
  entertainment: IconMovie,
  subscriptions: IconRefresh,
  loan: IconCash,
  investments: IconTrendingUp,
  insurance: IconShieldCheck,
};

export function getCategoryIcon(name: string): React.FC<IconProps> {
  return CATEGORY_ICONS[name.trim().toLowerCase()] ?? IconDots;
}

/**
 * Default group for the built-in categories, used to seed existing installs so
 * nobody opens the new screen to find every category sitting in Uncategorised.
 */
const DEFAULT_GROUPS: Record<string, CategoryGroup> = {
  food: 'Essentials',
  bills: 'Essentials',
  transport: 'Essentials',
  fuel: 'Essentials',
  health: 'Essentials',
  shopping: 'Lifestyle',
  entertainment: 'Lifestyle',
  subscriptions: 'Lifestyle',
  loan: 'Money & protection',
  investments: 'Money & protection',
  insurance: 'Money & protection',
};

export function getDefaultGroup(name: string): CategoryGroup | undefined {
  return DEFAULT_GROUPS[name.trim().toLowerCase()];
}

/**
 * Resolves the section a category belongs to: the user's stored choice first,
 * then a sensible default for known names, then Uncategorised.
 */
export function resolveGroup(
  name: string,
  stored?: Record<string, string>,
): CategoryGroup | typeof UNGROUPED_LABEL {
  const explicit = stored?.[name];
  if (explicit && (CATEGORY_GROUPS as readonly string[]).includes(explicit)) {
    return explicit as CategoryGroup;
  }
  return getDefaultGroup(name) ?? UNGROUPED_LABEL;
}

/** Section order for the Categories & budgets screen. */
export const GROUP_ORDER: string[] = [...CATEGORY_GROUPS, UNGROUPED_LABEL];
