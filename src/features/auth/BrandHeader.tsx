import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { SCHOOL_INSTANCE } from './validation';

export function TopBar() {
  return (
    <View style={styles.topBar}>
      <View style={[styles.chip, styles.chipMint]}>
        <Ionicons name="calendar-outline" size={14} color={colors.primaryDeep} />
        <Text style={[styles.chipText, { color: colors.primaryDeep }]}>AY 2026–2027</Text>
      </View>
      <View style={[styles.chip, styles.chipGray]}>
        <Text style={[styles.chipText, { color: colors.textSecondary }]}>ADMIN PORTAL</Text>
      </View>
    </View>
  );
}

export function BrandHeader() {
  return (
    <View style={styles.center}>
      <View style={styles.logo}>
        <View style={styles.ring}>
          <View style={styles.dot} />
        </View>
      </View>
      <Text style={styles.title}>Verdant</Text>
      <Text style={styles.subtitle}>School Management ERP</Text>
      <View style={styles.instance}>
        <View style={styles.greenDot} />
        <Text style={styles.instanceText}>{SCHOOL_INSTANCE}</Text>
        <Ionicons name="chevron-expand" size={14} color={colors.textHint} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipMint: { backgroundColor: colors.mint, borderColor: '#bfe8e1' },
  chipGray: { backgroundColor: '#eef1f1', borderColor: '#e1e6e6' },
  chipText: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1 },
  center: { alignItems: 'center', gap: 6 },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.primaryDeep },
  title: { fontFamily: fonts.headingExtra, fontSize: 34, color: colors.text },
  subtitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
  instance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  instanceText: { fontFamily: fonts.mono, fontSize: 12, color: colors.text },
});
