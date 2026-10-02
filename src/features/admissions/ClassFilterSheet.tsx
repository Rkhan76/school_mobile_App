import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import { getClassesMaster } from '../common/api';
import type { ClassWithSections } from '../common/types';

export type ClassOption = { id: string; name: string } | null;

type Props = { visible: boolean; value: ClassOption; onApply: (v: ClassOption) => void; onClose: () => void };

export function ClassFilterSheet({ visible, value, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<ClassOption>(value);
  const [classes, setClasses] = useState<ClassWithSections[]>([]);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  useEffect(() => {
    getClassesMaster()
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Filter by class</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.options}>
          {[{ id: 'all', name: 'All Classes' } as const, ...classes.map((c) => ({ id: c.id, name: c.name }))].map((c) => {
            const active = c.id === 'all' ? draft === null : draft?.id === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setDraft(c.id === 'all' ? null : { id: c.id, name: c.name })}
                style={[styles.opt, active && styles.optActive]}
              >
                <Text style={[styles.optText, active && styles.optTextActive]}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.reset]} onPress={() => setDraft(null)}>
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
