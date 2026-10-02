import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import type { PromotionResult, PromotionStudent } from './mockPromotion';

type Props = {
  result: PromotionResult | null;
  students: PromotionStudent[];
  onClose: () => void;
};

export function ResultModal({ result, students, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const byId = new Map(students.map((s) => [s.id, s]));
  const hasFail = (result?.failed.length ?? 0) > 0;
  return (
    <Modal visible={result !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Promotion result</Text>
        {result ? (
          <>
            <View style={styles.summary}>
              <View style={[styles.stat, { backgroundColor: colors.successBg }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={[styles.statNum, { color: colors.success }]}>{result.succeeded}</Text>
                <Text style={styles.statLabel}>Succeeded</Text>
              </View>
              <View style={[styles.stat, { backgroundColor: hasFail ? colors.dangerBg : '#eef2f1' }]}>
                <Ionicons name="close-circle" size={22} color={hasFail ? colors.danger : colors.textHint} />
                <Text style={[styles.statNum, { color: hasFail ? colors.danger : colors.textSecondary }]}>
                  {result.failed.length}
                </Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
            </View>
            {hasFail ? (
              <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                {result.failed.map((f) => {
                  const s = byId.get(f.studentId);
                  return (
                    <View key={f.studentId} style={styles.failRow}>
                      <Text style={styles.failName}>{s?.name ?? f.studentId}</Text>
                      {s ? <Text style={styles.failAdm}>{s.admissionNo}</Text> : null}
                      <Text style={styles.failErr}>{f.error}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : null}
          </>
        ) : null}
        <Pressable style={styles.done} onPress={onClose}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, maxHeight: '80%', gap: 12,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  summary: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, borderRadius: radius.lg, padding: 14, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: fonts.headingExtra, fontSize: 28 },
  statLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  list: { flexGrow: 0 },
  listContent: { gap: 8 },
  failRow: {
    padding: 12, borderRadius: radius.md, backgroundColor: colors.dangerBg, borderWidth: 1,
    borderColor: colors.dangerBorder, gap: 2,
  },
  failName: { fontFamily: fonts.headingSemi, fontSize: 14, color: colors.danger },
  failAdm: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary },
  failErr: { fontFamily: fonts.body, fontSize: 12, color: colors.danger, marginTop: 2 },
  done: { height: 48, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  doneText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white },
});
