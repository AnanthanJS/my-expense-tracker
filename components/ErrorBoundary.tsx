import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SPACING, TEXT, RADII } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import PressableScale from './PressableScale';

type ThemeColors = ReturnType<typeof useAppTheme>['colors'];

interface Props {
  children: ReactNode;
  colors: ThemeColors;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    const { colors } = this.props;

    if (this.state.hasError) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={styles.emoji}>!</Text>
          <Text style={[styles.title, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            An unexpected error occurred. Please try again.
          </Text>
          <PressableScale style={[styles.button, { backgroundColor: colors.primary }]} onPress={this.handleReset}>
            <Text style={[styles.buttonText, { color: colors.background }]}>Try Again</Text>
          </PressableScale>
        </View>
      );
    }

    return this.props.children;
  }
}

const ThemedErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { colors } = useAppTheme();
  return <ErrorBoundary colors={colors}>{children}</ErrorBoundary>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  emoji: {
    // Decorative illustration, not type — deliberately off the TYPE scale.
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    ...TEXT.title,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT.proseLg,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    paddingHorizontal: 30,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: RADII.sm,
  },
  buttonText: {
    ...TEXT.button,
  },
});

export default ThemedErrorBoundary;
