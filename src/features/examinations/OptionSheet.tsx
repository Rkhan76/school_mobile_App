import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';

export type SheetOption = { value: string; label: string; sub?: string };

type Props = {
  visible: boolean;
  title: string;
  options: SheetOption[];
  value: string | null;
  onSelect: (v: string) => void;
  onClose: () => void;
};

/** Single-choice bottom-sheet picker. */
export function OptionSheet({ visible, title, options, value, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <ScrollView style={styles.scroll}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable key={o.value} style={[styles.row, active && styles.rowActive]} onPress={() => onSelect(o.value)}>
                <View style={styles.rowText}>
                  <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>{o.label}</Text>
                  {o.sub ? <Text style={styles.sub} numberOfLines={1}>{o.sub}</Text> : null}
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 28, maxHeight: '75%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.md, gap: 8 },
  rowActive: { backgroundColor: colors.mintSoft },
  rowText: { flex: 1 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  labelActive: { color: colors.primaryDeep, fontFamily: fonts.bodySemi },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
