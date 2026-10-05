import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';

export type Option = { value: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  /** label of the "clear" row (value '') */
  allLabel: string;
  options: Option[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
};

/** Single-select bottom sheet used for Class / Section / Academic year. */
export function OptionSheet({ visible, title, allLabel, options, value, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rows: Option[] = [{ value: '', label: allLabel }, ...options];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.scroll}>
          {rows.map((o) => {
            const active = o.value === value;
            return (
              <Pressable key={o.value || '__all'} onPress={() => onSelect(o.value)} style={[styles.row, active && styles.rowActive]}>
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{o.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '70%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  row: {
    height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: radius.md,
  },
  rowActive: { backgroundColor: colors.mintSoft },
  rowText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  rowTextActive: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
}));
