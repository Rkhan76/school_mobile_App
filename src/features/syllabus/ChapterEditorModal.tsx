import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import type { Chapter } from './mockSyllabus';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  chapters: Chapter[];
  onSave: (chapters: Chapter[]) => void;
  onClose: () => void;
};

let draftSeq = 0;
const newId = () => `new-${Date.now()}-${(draftSeq += 1)}`;

/** Modal editor: add / rename / remove chapters, adjust topic counts. */
export function ChapterEditorModal({ visible, title, subtitle, chapters, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Chapter[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      setDraft(chapters.map((c) => ({ ...c })));
      setErrors({});
    }
    // only reset when opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const patch = (id: string, p: Partial<Chapter>) => {
    setDraft((d) => d.map((c) => (c.id === id ? { ...c, ...p } : c)));
    if (p.title !== undefined) setErrors((e) => ({ ...e, [id]: '' }));
  };

  const add = () => setDraft((d) => [...d, { id: newId(), title: '', topics: 1 }]);
  const remove = (id: string) => setDraft((d) => d.filter((c) => c.id !== id));

  const submit = () => {
    const e: Record<string, string> = {};
    draft.forEach((c) => {
      if (!c.title.trim()) e[c.id] = 'Chapter name is required.';
    });
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave(draft.map((c) => ({ ...c, title: c.title.trim() })));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.headRow}>
            <View style={styles.flex}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.list}>
            {draft.length === 0 ? <Text style={styles.empty}>No chapters yet. Add the first one.</Text> : null}
            {draft.map((c, i) => (
              <View key={c.id} style={styles.item}>
                <View style={styles.itemRow}>
                  <Text style={styles.num}>{i + 1}</Text>
                  <TextInput
                    value={c.title}
                    onChangeText={(t) => patch(c.id, { title: t })}
                    placeholder="Chapter name"
                    placeholderTextColor={colors.textHint}
                    style={[styles.input, !!errors[c.id] && styles.inputErr]}
                  />
                  <Pressable onPress={() => remove(c.id)} hitSlop={8} accessibilityLabel={`Remove chapter ${i + 1}`}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </Pressable>
                </View>
                {errors[c.id] ? <Text style={styles.err}>{errors[c.id]}</Text> : null}
                <View style={styles.stepRow}>
                  <Text style={styles.stepLabel}>Topics</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => patch(c.id, { topics: Math.max(0, c.topics - 1) })}
                    accessibilityLabel="Fewer topics"
                  >
                    <Ionicons name="remove" size={16} color={colors.primaryDeep} />
                  </Pressable>
                  <Text style={styles.stepVal}>{c.topics}</Text>
                  <Pressable
                    style={styles.stepBtn}
                    onPress={() => patch(c.id, { topics: c.topics + 1 })}
                    accessibilityLabel="More topics"
                  >
                    <Ionicons name="add" size={16} color={colors.primaryDeep} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable style={styles.addBtn} onPress={add}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primaryDeep} />
              <Text style={styles.addText}>Add chapter</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={submit}>
              <Text style={styles.btnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, maxHeight: '88%',
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  scroll: { flexGrow: 0 },
  list: { gap: 10, paddingVertical: 6 },
  empty: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  item: { gap: 6, padding: 10, borderRadius: radius.md, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { width: 22, textAlign: 'center', fontFamily: fonts.monoMedium, fontSize: 13, color: colors.primaryDeep },
  input: {
    flex: 1, height: 42, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger, marginLeft: 32 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 32 },
  stepLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  stepBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.mint,
  },
  stepVal: { minWidth: 20, textAlign: 'center', fontFamily: fonts.monoMedium, fontSize: 13, color: colors.text },
  addBtn: {
    height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  footer: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  btnGhostText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.white },
});
