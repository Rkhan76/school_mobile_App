import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import type { SectionLite } from '../common/types';

type Props = {
  visible: boolean;
  /** other sections of the same class — current section already excluded */
  sections: SectionLite[];
  onClose: () => void;
  onConfirm: (sectionIds: string[], overwrite: boolean) => void;
};

/** Simple multi-select bottom sheet used by "Copy to other sections". */
export function CopySectionsSheet({ visible, sections, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [overwrite, setOverwrite] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(new Set());
      setOverwrite(false);
    }
  }, [visible]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => (prev.size === sections.length ? new Set() : new Set(sections.map((s) => s.id))));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Copy to other sections</Text>
        <Text style={styles.sub}>Pick the sections to copy this section&apos;s full syllabus plan into.</Text>

        {sections.length === 0 ? (
          <Text style={styles.empty}>No other sections in this class.</Text>
        ) : (
          <>
            <Pressable style={styles.allRow} onPress={toggleAll}>
              <Ionicons
                name={selected.size === sections.length ? 'checkbox' : 'square-outline'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.allText}>Select all</Text>
            </Pressable>
            <ScrollView style={styles.scroll}>
              {sections.map((s) => {
                const active = selected.has(s.id);
                return (
                  <Pressable key={s.id} onPress={() => toggle(s.id)} style={[styles.row, active && styles.rowActive]}>
                    <Ionicons name={active ? 'checkbox' : 'square-outline'} size={20} color={active ? colors.primary : colors.textHint} />
                    <Text style={[styles.rowText, active && styles.rowTextActive]}>{s.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.switchRow}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.switchText}>Overwrite existing plans</Text>
              <Switch
                value={overwrite}
                onValueChange={setOverwrite}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.footer}>
              <Pressable style={[styles.btn, styles.ghost]} onPress={onClose}>
                <Text style={styles.ghostText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.primary, selected.size === 0 && styles.btnDisabled]}
                disabled={selected.size === 0}
                onPress={() => onConfirm(Array.from(selected), overwrite)}
              >
                <Text style={styles.primaryText}>Copy{selected.size > 0 ? ` (${selected.size})` : ''}</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '80%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 10 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
  allRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  allText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  scroll: { flexGrow: 0, maxHeight: 260 },
  row: {
    height: 46, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radius.md,
  },
  rowActive: { backgroundColor: colors.mintSoft },
  rowText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  rowTextActive: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 6 },
  switchText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  footer: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.5 },
  ghost: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  ghostText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  primary: { backgroundColor: colors.primary },
  primaryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
});
