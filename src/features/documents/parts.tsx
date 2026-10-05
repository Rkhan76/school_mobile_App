import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, themed } from '../../theme/tokens';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Chip({ label, on, onPress, icon }: { label: string; on: boolean; onPress: () => void; icon?: IconName }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityState={{ selected: on }}>
      {icon ? <Ionicons name={icon} size={14} color={on ? colors.white : colors.textSecondary} /> : null}
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

type BtnTone = 'primary' | 'soft' | 'danger';

export function ActionBtn({
  label, icon, tone = 'soft', onPress, disabled,
}: { label: string; icon?: IconName; tone?: BtnTone; onPress: () => void; disabled?: boolean }) {
  const fg = tone === 'primary' ? colors.white : tone === 'danger' ? colors.danger : colors.primaryDeep;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, tone === 'primary' && styles.btnPrimary, tone === 'danger' && styles.btnDanger, disabled && { opacity: 0.5 }]}
    >
      {icon ? <Ionicons name={icon} size={15} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function RoleTag({ role }: { role: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{role}</Text>
    </View>
  );
}

export function SkeletonList({ count = 4, height = 150 }: { count?: number; height?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.skeleton, { height }]} />
      ))}
    </View>
  );
}

export function EmptyState({ icon, title, sub }: { icon: IconName; title: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.textHint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValue}>{children}</View>
    </View>
  );
}

export const infoText = themed(() => ({ fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text }));

const styles = themed(() => StyleSheet.create({
  chip: {
    height: 36, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  btn: {
    height: 36, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderRadius: radius.pill, backgroundColor: colors.mint,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnDanger: { backgroundColor: colors.dangerBg },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.neutralBg },
  tagText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.textSecondary },
  skeleton: { borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  infoLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  infoValue: { flexShrink: 1, alignItems: 'flex-end' },
}));
