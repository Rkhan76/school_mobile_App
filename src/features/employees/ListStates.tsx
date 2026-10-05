import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../theme/tokens';

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function CardSkeleton() {
  return (
    <View style={styles.skel}>
      <View style={styles.row}>
        <View style={[styles.block, { width: 46, height: 46, borderRadius: 23 }]} />
        <View style={{ flex: 1, gap: 8 }}>
          <View style={[styles.block, { width: '60%', height: 14 }]} />
          <View style={[styles.block, { width: '30%', height: 10 }]} />
        </View>
      </View>
      <View style={[styles.block, { width: '80%', height: 10 }]} />
      <View style={[styles.block, { width: '65%', height: 10 }]} />
      <View style={[styles.block, { width: '75%', height: 10 }]} />
    </View>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.center}>
      <Ionicons name="people-outline" size={44} color={colors.textHint} />
      <Text style={styles.title}>{title}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={44} color={colors.danger} />
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.hint}>{message}</Text>
      <Pressable style={styles.retry} onPress={onRetry}>
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  skel: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  block: { backgroundColor: colors.mint, borderRadius: 6 },
  center: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: 8, paddingHorizontal: 20, height: 42, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  retryText: { fontFamily: fonts.bodySemi, color: colors.white, fontSize: 14 },
}));
