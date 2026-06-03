import { useContext } from 'react';
import { useColorScheme } from 'react-native';
import { AppContext } from '../context/AppContext';
import { COLORS, paperDarkTheme, paperLightTheme } from '../constants/theme';

export const useAppTheme = () => {
  const systemColorScheme = useColorScheme();
  const context = useContext(AppContext);
  
  let isDark = systemColorScheme === 'dark';
  if (context?.settings?.isDarkMode === 'dark') isDark = true;
  else if (context?.settings?.isDarkMode === 'light') isDark = false;

  const colors = isDark ? COLORS.dark : COLORS.light;
  const paperTheme = isDark ? paperDarkTheme : paperLightTheme;

  return {
    isDark,
    colors,
    paperTheme,
  };
};
