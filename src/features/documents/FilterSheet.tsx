import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { Chip } from './parts';
import { ROLES, type DocumentType, type PersonRole, type StatusFilter } from './mockDocuments';

export type RequestFilters = { status: StatusFilter; role: PersonRole | ''; typeId: string };
export const EMPTY_FILTERS: RequestFilters = { status: '', role: '', typeId: '' };

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'FULFILLED', label: 'Fulfilled' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'OVERDUE', label: 'Overdue' },
];

export function countFilters(f: RequestFilters): number {
  return (f.status ? 1 : 0) + (f.role ? 1 : 0) + (f.typeId ? 1 : 0);
}

type Props = {
  visible: boolean;
  filters: RequestFilters;
  types: DocumentType[];
  onChange: (f: RequestFilters) => void;
  onClose: () => void;
};

export function FilterSheet({ visible, filters, types, onChange, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grab} />
        <Text style={styles.title}>Filter requests</Text>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 6 }}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.wrap}>
            {STATUSES.map((s) => (
              <Chip key={s.label} label={s.label} on={filters.status === s.value} onPress={() => onChange({ ...filters, status: s.value })} />
            ))}
          </View>
          <Text style={styles.label}>People</Text>
          <View style={styles.wrap}>
            <Chip label="All people" on={filters.role === ''} onPress={() => onChange({ ...filters, role: '' })} />
            {ROLES.map((r) => (
              <Chip key={r} label={`${r}s`} on={filters.role === r} onPress={() => onChange({ ...filters, role: r })} />
            ))}
          </View>
          <Text style={styles.label}>Document type</Text>
          <View style={styles.wrap}>
            <Chip label="All document types" on={filters.typeId === ''} onPress={() => onChange({ ...filters, typeId: '' })} />
            {types.map((t) => (
              <Chip key={t.id} label={t.name} on={filters.typeId === t.id} onPress={() => onChange({ ...filters, typeId: t.id })} />
            ))}
          </View>
        </ScrollView>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => onChange(EMPTY_FILTERS)}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.done]} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.4)' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 16, paddingTop: 10, gap: 10,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  done: { backgroundColor: colors.primary },
  doneText: { fontFamily: fonts.bodySemi, color: colors.white },
});
