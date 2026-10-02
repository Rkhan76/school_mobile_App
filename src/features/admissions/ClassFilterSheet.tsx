import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import { CLASS_OPTIONS } from './mockAdmissions';

type Props = { visible: boolean; value: string; onApply: (v: string) => void; onClose: () => void };

export function ClassFilterSheet({ visible, value, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filter by class</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.options}>
          {['All', ...CLASS_OPTIONS].map((c) => {
            const active = draft === c;
            return (
              <Pressable key={c} onPress={() => setDraft(c)} style={[styles.opt, active && styles.optActive]}>
                <Text style={[styles.optText, active && styles.optTextActive]}>{c === 'All' ? 'All Classes' : c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => setDraft('All')}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.apply]} onPress={() => onApply(draft)}>
            <Text style={styles.applyText}>Apply</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    padding: 20, paddingBottom: 32, maxHeight: '75%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, marginBottom: 12 },
  scroll: { flexGrow: 0 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 8 },
  opt: { paddingHorizontal: 14, height: 38, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  optActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  optTextActive: { color: colors.white },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  reset: { backgroundColor: colors.mint },
  resetText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  apply: { backgroundColor: colors.primary },
  applyText: { fontFamily: fonts.bodySemi, color: colors.white },
});
