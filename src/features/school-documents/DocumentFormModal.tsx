import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  inputToIso, isoToInput, type DocumentCategory, type DocumentInput, type SchoolDocument,
} from './mockSchoolDocuments';

type Props = {
  visible: boolean;
  /** null = upload mode */
  document: SchoolDocument | null;
  /** real categories only (no "All documents") */
  categories: DocumentCategory[];
  /** category preselected when uploading */
  defaultCategoryId: string;
  onSubmit: (input: DocumentInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'title' | 'category' | 'expiresAt' | 'fileName' | 'size', string>>;

export function DocumentFormModal({ visible, document: doc, categories, defaultCategoryId, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [classified, setClassified] = useState(false);
  const [expires, setExpires] = useState('');
  const [fileName, setFileName] = useState('');
  const [size, setSize] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setTitle(doc?.title ?? '');
      setDescription(doc?.description ?? '');
      setCategoryId(doc?.categoryId ?? defaultCategoryId);
      setClassified(doc?.classified ?? false);
      setExpires(doc?.expiresAt ? isoToInput(doc.expiresAt) : '');
      setFileName(doc?.fileName ?? '');
      setSize(doc?.sizeLabel ?? '');
      setErrors({});
    }
  }, [visible, doc, defaultCategoryId]);

  const submit = () => {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!categoryId) e.category = 'Select a category.';
    let expIso: string | null = null;
    if (expires.trim()) {
      expIso = inputToIso(expires);
      if (!expIso) e.expiresAt = 'Enter a valid date as DD/MM/YYYY.';
    }
    if (!fileName.trim()) e.fileName = 'A file is required.';
    if (!size.trim()) e.size = 'Enter the file size, e.g. 1.8 MB.';
    setErrors(e);
    if (Object.keys(e).length === 0) {
      onSubmit({
        title: title.trim(), description: description.trim(), categoryId, classified,
        expiresAt: expIso, fileName: fileName.trim(), sizeLabel: size.trim(),
      });
    }
  };

  const bumpsVersion = !!doc && fileName.trim() !== '' && fileName.trim() !== doc.fileName;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>{doc ? 'Edit document' : 'Upload document'}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="Document title" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.title && styles.inputErr]}
          />
          {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Short description" placeholderTextColor={colors.textHint}
            multiline style={[styles.input, styles.multi]}
          />

          <Text style={styles.label}>Category *</Text>
          <View style={styles.chips}>
            {categories.map((c) => {
              const on = c.id === categoryId;
              return (
                <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, on && styles.chipOn]}>
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.category ? <Text style={styles.err}>{errors.category}</Text> : null}

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Classified</Text>
              <Text style={styles.switchSub}>Restrict this document to authorised staff.</Text>
            </View>
            <Switch
              value={classified} onValueChange={setClassified}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white}
            />
          </View>

          <Text style={styles.label}>Expiry date (optional)</Text>
          <TextInput
            value={expires} onChangeText={setExpires} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.expiresAt && styles.inputErr]}
          />
          {errors.expiresAt ? <Text style={styles.err}>{errors.expiresAt}</Text> : null}

          <Pressable style={styles.attach} onPress={() => Alert.alert('File picker', 'File picker coming soon')}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryDeep} />
            <Text style={styles.attachText}>Choose file</Text>
          </Pressable>
          <Text style={styles.hint}>Until the picker is ready, type a mock file name and size below.</Text>

          <View style={styles.row}>
            <View style={styles.fileCol}>
              <Text style={styles.label}>File name *</Text>
              <TextInput
                value={fileName} onChangeText={setFileName} placeholder="file.pdf" placeholderTextColor={colors.textHint}
                autoCapitalize="none" autoCorrect={false}
                style={[styles.input, styles.mono, !!errors.fileName && styles.inputErr]}
              />
              {errors.fileName ? <Text style={styles.err}>{errors.fileName}</Text> : null}
            </View>
            <View style={styles.sizeCol}>
              <Text style={styles.label}>Size *</Text>
              <TextInput
                value={size} onChangeText={setSize} placeholder="1.8 MB" placeholderTextColor={colors.textHint}
                autoCapitalize="characters" autoCorrect={false}
                style={[styles.input, styles.mono, !!errors.size && styles.inputErr]}
              />
              {errors.size ? <Text style={styles.err}>{errors.size}</Text> : null}
            </View>
          </View>
          {bumpsVersion && doc ? (
            <Text style={styles.hint}>A new file name will save this as version v{doc.version + 1}.</Text>
          ) : null}
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>{doc ? 'Save changes' : 'Upload'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  mono: { fontFamily: fonts.mono, fontSize: 13 },
  multi: { height: 96, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  switchText: { flex: 1 },
  switchTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  switchSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  attach: {
    marginTop: 14, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: colors.mintSoft,
  },
  attachText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  row: { flexDirection: 'row', gap: 10 },
  fileCol: { flex: 3, gap: 6 },
  sizeCol: { flex: 2, gap: 6 },
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
