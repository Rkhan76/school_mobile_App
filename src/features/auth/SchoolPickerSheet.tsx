import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';

type SchoolOption = { schoolId: string; schoolName: string };

type Props = {
  visible: boolean;
  schools: SchoolOption[];
  onSelect: (schoolId: string) => void;
  onClose: () => void;
  loading?: boolean;
};

/** Bottom sheet for picking which school to sign into when an account spans multiple schools. */
export function SchoolPickerSheet({ visible, schools, onSelect, onClose, loading }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Text style={styles.title}>Select your school</Text>
          <Pressable onPress={onClose} disabled={loading} hitSlop={10} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.list}>
          {schools.map((school, i) => (
            <Pressable
              key={school.schoolId}
              onPress={() => onSelect(school.schoolId)}
              disabled={loading}
              style={[styles.row, i > 0 && styles.rowBorder, loading && styles.rowDisabled]}
            >
              <Ionicons name="business-outline" size={20} color={colors.primaryDeep} />
              <Text style={styles.rowText}>{school.schoolName}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  list: { marginTop: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowDisabled: { opacity: 0.5 },
  rowText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  loadingRow: { paddingVertical: 20, alignItems: 'center' },
  cancel: { height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: 16, backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.primaryDeep },
});
