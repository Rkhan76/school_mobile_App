import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { EVENT_AUDIENCES, EVENT_STATUSES, type EventAudience, type EventStatus } from './types';

type Props = {
  visible: boolean;
  status: EventStatus | '';
  targetAudience: EventAudience | '';
  onChange: (next: { status: EventStatus | ''; targetAudience: EventAudience | '' }) => void;
  onClose: () => void;
};

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom sheet with status + audience filter chips. */
export function FilterSheet({ visible, status, targetAudience, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filters</Text>

        <Text style={styles.label}>STATUS</Text>
        <View style={styles.chips}>
          <Chip label="All Statuses" active={status === ''} onPress={() => onChange({ status: '', targetAudience })} />
          {EVENT_STATUSES.map((s) => (
            <Chip key={s} label={s} active={status === s} onPress={() => onChange({ status: s, targetAudience })} />
          ))}
        </View>

        <Text style={styles.label}>AUDIENCE</Text>
        <View style={styles.chips}>
          <Chip
            label="All Audiences"
            active={targetAudience === ''}
            onPress={() => onChange({ status, targetAudience: '' })}
          />
          {EVENT_AUDIENCES.map((a) => (
            <Chip
              key={a}
              label={a}
              active={targetAudience === a}
              onPress={() => onChange({ status, targetAudience: a })}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => onChange({ status: '', targetAudience: '' })}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.apply]} onPress={onClose}>
            <Text style={styles.applyText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary, marginTop: 16, marginBottom: 8, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, borderRadius: radius.pill, justifyContent: 'center',
    backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontFamily: fonts.bodySemi },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
