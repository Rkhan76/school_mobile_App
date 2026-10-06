import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, themed } from '../../theme/tokens';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; message: string; kind: ToastKind };

const DURATION_MS = 2600;

let nextId = 1;
let listener: ((t: ToastItem) => void) | null = null;

/** Show a short, auto-dismissing message. Safe to call from anywhere (hooks, handlers) once <ToastHost /> is mounted. */
export function showToast(message: string, kind: ToastKind = 'success'): void {
  listener?.({ id: nextId++, message, kind });
}

const ICONS: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

/** Mount once near the app root, above the navigator. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    listener = (t) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(t);
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
          if (finished) setToast((cur) => (cur?.id === t.id ? null : cur));
        });
      }, DURATION_MS);
    };
    return () => {
      listener = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [opacity]);

  if (!toast) return null;

  const tint = toast.kind === 'success' ? colors.success : toast.kind === 'error' ? colors.danger : colors.primary;
  return (
    <View pointerEvents="none" style={[styles.wrap, { bottom: insets.bottom + 24 }]}>
      <Animated.View style={[styles.toast, { opacity, borderLeftColor: tint }]}>
        <Ionicons name={ICONS[toast.kind]} size={20} color={tint} />
        <Text style={styles.text}>{toast.message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    backgroundColor: colors.cardSolid,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  text: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
}));
