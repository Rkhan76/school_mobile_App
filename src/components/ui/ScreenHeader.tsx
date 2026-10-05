import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, themed } from '../../theme/tokens';

type Props = { title: string; subtitle?: string; back?: boolean; right?: ReactNode };

/** Top bar for list / detail screens: optional back arrow, title, right-side actions. */
export function ScreenHeader({ title, subtitle, back, right }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      {back && (
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
          style={styles.back}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      )}
      <View style={styles.titles}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  titles: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
}));
