import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import type { Option } from './mockPromotion';

type Props = {
  label?: string;
  placeholder: string;
  title: string;
  value?: string;
  options: Option[];
  onChange: (v: string) => void;
  disabled?: boolean;
  compact?: boolean;
};

/** Tappable select that opens a bottom-sheet list picker. */
export function SelectField({ label, placeholder, title, value, options, onChange, disabled, compact }: Props) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const current = options.find((o) => o.value === value);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, compact && styles.compact, disabled && styles.disabled]}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${current?.label ?? placeholder}`}
      >
        <Text style={[styles.value, !current && styles.placeholder]} numberOfLines={1}>
          {current?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textHint} />
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.scroll}>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  style={[styles.opt, active && styles.optActive]}
                  onPress={() => { onChange(o.value); setOpen(false); }}
                >
                  <Text style={[styles.optText, active && styles.optTextActive]}>{o.label}</Text>
                  {active ? <Ionicons name="checkmark" size={18} color={colors.primaryDeep} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 4 },
  label: { fontFamily: fonts.bodySemi, fontSize: 10, letterSpacing: 0.8, color: colors.textSecondary, textTransform: 'uppercase' },
  field: {
    height: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  compact: { height: 40, paddingHorizontal: 10 },
  disabled: { opacity: 0.45, backgroundColor: '#eef2f1' },
  value: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  placeholder: { color: colors.textHint },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, maxHeight: '70%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  opt: {
    height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.md,
  },
  optActive: { backgroundColor: colors.mint },
  optText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  optTextActive: { color: colors.primaryDeep, fontFamily: fonts.bodySemi },
});
