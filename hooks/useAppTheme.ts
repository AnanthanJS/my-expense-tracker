import { useColorScheme } from 'react-native';
import { COLORS, paperDarkTheme, paperLightTheme } from '../constants/theme';

export const useAppTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;

  return {
    isDark,
    colors,
    paperTheme,
  };
};
