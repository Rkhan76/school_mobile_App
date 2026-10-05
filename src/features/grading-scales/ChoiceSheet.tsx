import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';

export type Choice = { value: string; label: string; hint?: string };

type Props = {
  visible: boolean;
  title: string;
  options: Choice[];
  /** selected value; omit for pure action pickers (e.g. templates) */
  value?: string;
  onSelect: (v: string) => void;
  onClose: () => void;
};

/** Generic bottom sheet: scale picker and template picker. */
export function ChoiceSheet({ visible, title, options, value, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.scroll}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable key={o.value} onPress={() => onSelect(o.value)} style={[styles.row, active && styles.rowActive]}>
                <View style={styles.texts}>
                  <Text style={[styles.rowText, active && styles.rowTextActive]}>{o.label}</Text>
                  {o.hint ? <Text style={styles.hint}>{o.hint}</Text> : null}
                </View>
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
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '75%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  row: {
    minHeight: 52, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderRadius: radius.md, gap: 8,
  },
  rowActive: { backgroundColor: colors.mintSoft },
  texts: { flex: 1, gap: 2 },
  rowText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  rowTextActive: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
}));
