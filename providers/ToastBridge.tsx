import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from './ToastProvider';

/**
 * Routes AppContext's `feedback` into the toast system.
 *
 * `showFeedback` has ~35 call sites across the app. Rewriting them all would
 * be churn for no behavioural gain, and the context cannot call `useToast`
 * itself — the toast provider reads the theme from AppContext, so a direct
 * dependency the other way would be circular. This bridge sits inside both
 * and forwards one to the other.
 *
 * Mapping:
 * · the tone passes straight through to the toast variant
 * · an undo handler becomes an Undo action, held longer so it can be used
 * · errors are given an explicit duration so transient validation messages
 *   still dismiss themselves; only errors raised with their own action (the
 *   Retry on a failed save) are left to wait for the user
 */
const TRANSIENT_ERROR_MS = 4000;

const ToastBridge: React.FC = () => {
  const { feedback, hideFeedback } = useApp();
  const toast = useToast();

  /** Guards against re-showing the same feedback on an unrelated re-render. */
  const lastShown = useRef<string | null>(null);

  useEffect(() => {
    if (!feedback.visible || !feedback.message) return;

    const signature = `${feedback.message}|${feedback.type}`;
    if (lastShown.current === signature) return;
    lastShown.current = signature;

    toast.show({
      variant: feedback.type,
      title: feedback.message,
      action: feedback.onUndo
        ? { label: 'Undo', onPress: feedback.onUndo }
        : undefined,
      duration: feedback.type === 'error' ? TRANSIENT_ERROR_MS : undefined,
    });

    // Consume it, so the same message can be raised again later.
    hideFeedback();
  }, [feedback, toast, hideFeedback]);

  useEffect(() => {
    if (!feedback.visible) lastShown.current = null;
  }, [feedback.visible]);

  return null;
};

export default ToastBridge;
