import { useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { Avatar } from '../../components/ui/Avatar';
import { Chip, RoleTag } from './parts';
import { PEOPLE, inputToIso, TODAY_ISO, type BulkInput, type DocumentType } from './mockDocuments';

type Props = {
  visible: boolean;
  types: DocumentType[];
  onSubmit: (input: BulkInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'type' | 'due' | 'people', string>>;

export function BulkRequestModal({ visible, types, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [typeId, setTypeId] = useState('');
  const [due, setDue] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setTypeId('');
      setDue('');
      setQuery('');
      setSelected(new Set());
      setErrors({});
    }
  }, [visible]);

  const type = types.find((t) => t.id === typeId);
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PEOPLE.filter((p) => (!type || type.appliesTo.includes(p.role)) && (!q || p.name.toLowerCase().includes(q)));
  }, [type, query]);

  const pickType = (id: string) => {
    setTypeId(id);
    const t = types.find((x) => x.id === id);
    if (t) {
      setSelected((prev) => {
        const next = new Set<string>();
        prev.forEach((pid) => {
          const p = PEOPLE.find((x) => x.id === pid);
          if (p && t.appliesTo.includes(p.role)) next.add(pid);
        });
        return next;
      });
    }
  };

  const allSelected = people.length > 0 && people.every((p) => selected.has(p.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) people.forEach((p) => next.delete(p.id));
      else people.forEach((p) => next.add(p.id));
      return next;
    });
  };
  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submit = () => {
    const e: Errors = {};
    if (!typeId) e.type = 'Pick a document type.';
    const iso = inputToIso(due);
    if (!iso) e.due = 'Enter a valid date as DD/MM/YYYY.';
    else if (iso < TODAY_ISO) e.due = 'Due date cannot be in the past.';
    if (selected.size === 0) e.people = 'Select at least one person.';
    setErrors(e);
    if (Object.keys(e).length === 0 && iso) {
      onSubmit({ typeId, dueDate: iso, personIds: Array.from(selected) });
    }
  };

  const header = (
    <View style={styles.form}>
      <Text style={styles.label}>Document type *</Text>
      <View style={styles.wrap}>
        {types.map((t) => (
          <Chip key={t.id} label={t.name} on={t.id === typeId} onPress={() => pickType(t.id)} />
        ))}
      </View>
      {errors.type ? <Text style={styles.err}>{errors.type}</Text> : null}

      <Text style={styles.label}>Due date *</Text>
      <TextInput
        value={due} onChangeText={setDue} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
        keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.due && styles.inputErr]}
      />
      {errors.due ? <Text style={styles.err}>{errors.due}</Text> : null}

      <View style={styles.peopleHead}>
        <Text style={styles.label}>People * ({selected.size} selected)</Text>
        <Pressable onPress={toggleAll} hitSlop={8}>
          <Text style={styles.selectAll}>{allSelected ? 'Clear all' : 'Select all'}</Text>
        </Pressable>
      </View>
      <TextInput
        value={query} onChangeText={setQuery} placeholder="Search people..." placeholderTextColor={colors.textHint}
        style={styles.input} autoCorrect={false}
      />
      {errors.people ? <Text style={styles.err}>{errors.people}</Text> : null}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>Bulk request</Text>
        </View>
        <FlatList
          data={people}
          keyExtractor={(p) => p.id}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={14}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const on = selected.has(item.id);
            return (
              <Pressable onPress={() => toggle(item.id)} style={[styles.person, on && styles.personOn]}>
                <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.primary : colors.textHint} />
                <Avatar name={item.name} size={32} />
                <Text style={styles.personName} numberOfLines={1}>{item.name}</Text>
                <RoleTag role={item.role} />
              </Pressable>
            );
          }}
          ListEmptyComponent={<Text style={styles.none}>No people match.</Text>}
        />
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>Send request{selected.size ? ` (${selected.size})` : ''}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  peopleHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectAll: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep, marginTop: 8 },
  person: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 6, padding: 10,
    borderRadius: radius.md, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  personOn: { borderColor: colors.primary, backgroundColor: colors.mintSoft },
  personName: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  none: { textAlign: 'center', paddingVertical: 24, fontFamily: fonts.body, color: colors.textSecondary },
  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
});
