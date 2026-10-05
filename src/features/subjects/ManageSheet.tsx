import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { ClassWithSections } from '../common/types';
import type { SubjectWithAssignments } from './types';

type Props = {
  subject: SubjectWithAssignments | null;
  classes: ClassWithSections[];
  /** Section assignments are synced for this academic year only. */
  activeYearId: string;
  activeYearLabel?: string;
  onClose: () => void;
  onSave: (id: string, sectionIds: string[]) => void;
};

/** Bottom sheet to add / remove the class-sections a subject is assigned to (local state until Save). */
export function ManageSheet({ subject, classes, activeYearId, activeYearLabel, onClose, onSave }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (subject) {
      setSelected(
        subject.assignments.filter((a) => a.academicYearId === activeYearId).map((a) => a.sectionId),
      );
    }
  }, [subject, activeYearId]);

  const groups = classes.map((c) => ({ cls: c, sections: c.sections }));

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Modal visible={subject !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <Text style={styles.title}>Manage assignments</Text>
        <Text style={styles.sub}>
          {subject ? `${subject.name} (${subject.subjectCode})` : ''} · {selected.length} selected
          {activeYearLabel ? ` · ${activeYearLabel}` : ''}
        </Text>
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {groups.map(({ cls, sections }) => (
            <View key={cls.id} style={styles.group}>
              <Text style={styles.groupTitle}>{cls.name}</Text>
              <View style={styles.sectionRow}>
                {sections.map((s) => {
                  const on = selected.includes(s.id);
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => toggle(s.id)}
                      style={[styles.item, on && styles.itemOn]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={`${cls.name} · Section ${s.name}`}
                    >
                      <View style={[styles.box, on && styles.boxOn]}>
                        {on ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                      </View>
                      <Text style={[styles.itemText, on && styles.itemTextOn]}>Section {s.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
        {!activeYearId ? (
          <Text style={styles.warn}>No academic year is configured — saving is disabled.</Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.save, !activeYearId && styles.saveDisabled]}
            disabled={!activeYearId}
            onPress={() => {
              if (subject) onSave(subject.id, selected);
              onClose();
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  scroll: { flexGrow: 0 },
  group: { paddingVertical: 8, gap: 6 },
  groupTitle: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  sectionRow: { flexDirection: 'row', gap: 8 },
  item: {
    flex: 1, height: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.mintSoft,
  },
  itemOn: { borderColor: colors.primary, backgroundColor: colors.mint },
  box: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: colors.textHint, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  itemTextOn: { color: colors.primaryDeep },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveDisabled: { opacity: 0.5 },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
  warn: { fontFamily: fonts.body, fontSize: 12, color: colors.danger, marginTop: 8 },
}));
