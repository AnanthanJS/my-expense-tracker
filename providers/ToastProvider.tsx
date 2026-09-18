import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from 'react';
import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from '../components/Toast';
import type { ToastOptions } from '../components/Toast';

export type { ToastOptions, ToastVariant, ToastAction } from '../components/Toast';

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/** Hold before auto-dismiss. */
const DEFAULT_DURATION = 2400;
/** Longer when there is something to act on — an Undo needs reading time. */
const ACTION_DURATION = 5000;

interface QueuedToast extends ToastOptions {
  /** Bumped per show() so a replacement remounts and replays the entrance. */
  key: number;
}

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const insets = useSafeAreaInsets();

  const [current, setCurrent] = useState<QueuedToast | null>(null);
  const [visible, setVisible] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextKey = useRef(0);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  /**
   * One toast at a time. A second call replaces the first outright rather than
   * queueing: these are confirmations of what the user just did, so the newest
   * is the only one still worth reading.
   */
  const show = useCallback((options: ToastOptions) => {
    clearTimer();
    nextKey.current += 1;
    setCurrent({ ...options, key: nextKey.current });
    setVisible(true);

    // `error` is the only tone that waits for the user — it reports a failure
    // that may need acting on. A destructive toast auto-dismisses like the
    // rest; its Undo simply gets the longer hold. A transient error can still
    // opt out by passing its own duration.
    const sticky = options.variant === 'error' && options.duration === undefined;
    if (!sticky) {
      const fallback = options.action ? ACTION_DURATION : DEFAULT_DURATION;
      timer.current = setTimeout(() => setVisible(false), options.duration ?? fallback);
    }
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  /** Unmount only after the exit animation has run. */
  const handleHidden = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && (
        <View
          // box-none so the toast never swallows a tap meant for the screen
          // underneath — only the card itself is touchable.
          pointerEvents="box-none"
          style={[styles.host, { top: insets.top + 14 }]}
        >
          <Toast
            key={current.key}
            variant={current.variant}
            title={current.title}
            meta={current.meta}
            action={current.action}
            duration={current.duration}
            visible={visible}
            onHidden={handleHidden}
            onDismiss={hide}
          />
        </View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 20,
  },
});

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
