import { useColorScheme } from 'react-native';
import { COLORS, paperDarkTheme, paperLightTheme } from '../constants/theme';
import { useAppOptional } from '../context/AppContext';

/**
 * Resolves the active theme.
 *
 * The app previously followed the OS and nothing else, with no way to override
 * it — so a user who wanted the dark palette had to change their whole device.
 * The stored preference wins; 'system' (the default) falls back to the OS.
 *
 * Reads the context optionally: this hook also runs outside the provider
 * (error boundary, splash path), where it should still return a usable theme.
 */
export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  const app = useAppOptional();
  const preference = app?.settings.theme ?? 'system';

  const isDark = preference === 'system'
    ? colorScheme === 'dark'
    : preference === 'dark';

  const colors = isDark ? COLORS.dark : COLORS.light;
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;

  return {
    isDark,
    colors,
    paperTheme,
  };
};
