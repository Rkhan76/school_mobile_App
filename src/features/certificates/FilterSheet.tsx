import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  CERTIFICATE_KINDS, KIND_LABEL, RECIPIENT_TYPES, STATUSES,
  type CertificateKind, type CertificateStatus, type RecipientType,
} from './mockCertificates';

export interface Filters {
  recipientType: RecipientType | '';
  kind: CertificateKind | '';
  status: CertificateStatus | '';
}

export const EMPTY_FILTERS: Filters = { recipientType: '', kind: '', status: '' };

type Props = { visible: boolean; value: Filters; onApply: (f: Filters) => void; onClose: () => void };

function Group<T extends string>({
  label, options, value, onChange, display,
}: {
  label: string; options: T[]; value: T | ''; onChange: (v: T | '') => void; display?: (v: T) => string;
}) {
  const all: (T | '')[] = ['', ...options];
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chips}>
        {all.map((o) => {
          const on = o === value;
          return (
            <Pressable key={o || 'all'} onPress={() => onChange(o)} style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o === '' ? 'All' : display ? display(o) : o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FilterSheet({ visible, value, onApply, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<Filters>(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close filters" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grab} />
          <Text style={styles.heading}>Filters</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Group label="Recipient type" options={RECIPIENT_TYPES} value={draft.recipientType}
              onChange={(v) => setDraft((d) => ({ ...d, recipientType: v }))} />
            <Group label="Certificate kind" options={CERTIFICATE_KINDS} value={draft.kind} display={(k) => KIND_LABEL[k]}
              onChange={(v) => setDraft((d) => ({ ...d, kind: v }))} />
            <Group label="Status" options={STATUSES} value={draft.status}
              onChange={(v) => setDraft((d) => ({ ...d, status: v }))} />
          </ScrollView>
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.reset]} onPress={() => setDraft(EMPTY_FILTERS)}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.apply]} onPress={() => onApply(draft)}>
              <Text style={styles.applyText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, gap: 10, maxHeight: '85%',
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  heading: { fontFamily: fonts.heading, fontSize: 19, color: colors.text },
  scroll: { flexGrow: 0 },
  group: { gap: 8, marginBottom: 14 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
});
