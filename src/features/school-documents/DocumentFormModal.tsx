import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { pickSchoolDocumentFile } from './pickFile';
import type {
  Confidentiality, DocumentCategory, FilePart, SchoolDocument, UpdateSchoolDocumentPayload,
  UploadDocumentPayload, UploadVersionPayload,
} from './types';
import { inputToIso, isoToInput } from './utils';

export type FormMode = 'upload' | 'edit' | 'version';

export type FormResult =
  | { mode: 'upload'; payload: UploadDocumentPayload; file: FilePart }
  | { mode: 'edit'; payload: UpdateSchoolDocumentPayload }
  | { mode: 'version'; payload: UploadVersionPayload; file: FilePart };

type Props = {
  visible: boolean;
  mode: FormMode;
  /** The document being edited or versioned. Null only when mode === 'upload'. */
  document: SchoolDocument | null;
  /** Pre-fill for 'version' mode, carried over from an older version's metadata. */
  prefill?: { description?: string; expiryDate?: string | null } | null;
  /** Real categories only (no "All documents"). */
  categories: DocumentCategory[];
  /** Category preselected when uploading. */
  defaultCategoryId: string;
  /** Only a holder of school-document.classified.read may mark a document CLASSIFIED. */
  canSetClassified: boolean;
  onSubmit: (result: FormResult) => Promise<void>;
  onClose: () => void;
};

type Errors = Partial<Record<'title' | 'category' | 'expiryDate' | 'file', string>>;

const TITLES: Record<FormMode, string> = { upload: 'Upload document', edit: 'Edit document', version: 'Upload new version' };
const SUBMIT_LABELS: Record<FormMode, string> = { upload: 'Upload', edit: 'Save changes', version: 'Upload version' };

export function DocumentFormModal({ visible, mode, document: doc, prefill, categories, defaultCategoryId, canSetClassified, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [classified, setClassified] = useState(false);
  const [expires, setExpires] = useState('');
  const [file, setFile] = useState<FilePart | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (mode === 'version') {
      setTitle(doc?.title ?? '');
      setDescription(prefill?.description ?? doc?.description ?? '');
      setCategoryId(doc?.categoryId ?? '');
      setClassified(doc?.confidentiality === 'CLASSIFIED');
      setExpires(prefill?.expiryDate ? isoToInput(prefill.expiryDate) : doc?.expiryDate ? isoToInput(doc.expiryDate) : '');
    } else {
      setTitle(doc?.title ?? '');
      setDescription(doc?.description ?? '');
      setCategoryId(doc?.categoryId ?? defaultCategoryId);
      setClassified(doc?.confidentiality === 'CLASSIFIED');
      setExpires(doc?.expiryDate ? isoToInput(doc.expiryDate) : '');
    }
    setFile(null);
    setErrors({});
    setSubmitting(false);
  }, [visible, mode, doc, prefill, defaultCategoryId]);

  const needsFile = mode === 'upload' || mode === 'version';
  const showTitleAndCategory = mode !== 'version';

  const submit = async () => {
    const e: Errors = {};
    if (showTitleAndCategory && !title.trim()) e.title = 'Title is required.';
    if (showTitleAndCategory && !categoryId) e.category = 'Select a category.';
    let expiryIso: string | null = null;
    if (expires.trim()) {
      expiryIso = inputToIso(expires);
      if (!expiryIso) e.expiryDate = 'Enter a valid date as DD/MM/YYYY.';
    }
    if (needsFile && !file) e.file = 'Attach a file to continue.';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      if (mode === 'upload') {
        await onSubmit({
          mode: 'upload',
          payload: {
            categoryId,
            title: title.trim(),
            description: description.trim() || undefined,
            confidentiality: canSetClassified ? (classified ? 'CLASSIFIED' : 'NORMAL') : undefined,
            expiryDate: expiryIso,
          },
          file: file as FilePart,
        });
      } else if (mode === 'edit') {
        const payload: UpdateSchoolDocumentPayload = {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          expiryDate: expiryIso,
        };
        if (canSetClassified) {
          payload.confidentiality = (classified ? 'CLASSIFIED' : 'NORMAL') as Confidentiality;
        }
        await onSubmit({ mode: 'edit', payload });
      } else {
        await onSubmit({
          mode: 'version',
          payload: { description: description.trim() || undefined, expiryDate: expiryIso },
          file: file as FilePart,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>{TITLES[mode]}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          {showTitleAndCategory ? (
            <>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                value={title} onChangeText={setTitle} placeholder="Document title" placeholderTextColor={colors.textHint}
                style={[styles.input, !!errors.title && styles.inputErr]}
              />
              {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}
            </>
          ) : (
            <View style={styles.readonlyRow}>
              <Text style={styles.label}>Title</Text>
              <Text style={styles.readonlyValue} numberOfLines={1}>{doc?.title}</Text>
              <Text style={styles.hint}>Title, category and confidentiality carry over from the original document.</Text>
            </View>
          )}

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Short description" placeholderTextColor={colors.textHint}
            multiline style={[styles.input, styles.multi]}
          />

          {showTitleAndCategory ? (
            <>
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
            </>
          ) : null}

          {showTitleAndCategory && canSetClassified ? (
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
          ) : null}

          <Text style={styles.label}>Expiry date (optional)</Text>
          <TextInput
            value={expires} onChangeText={setExpires} placeholder="dd/mm/yyyy" placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.expiryDate && styles.inputErr]}
          />
          {errors.expiryDate ? <Text style={styles.err}>{errors.expiryDate}</Text> : null}

          {needsFile ? (
            <>
              <Pressable style={styles.attach} onPress={() => pickSchoolDocumentFile(setFile)}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.primaryDeep} />
                <Text style={styles.attachText}>{file ? 'Choose a different file' : 'Choose file'}</Text>
              </Pressable>
              {file ? (
                <Text style={styles.fileInfo} numberOfLines={1}>{file.name}</Text>
              ) : (
                <Text style={styles.hint}>PDF, image, Word or Excel file — up to 25 MB.</Text>
              )}
              {errors.file ? <Text style={styles.err}>{errors.file}</Text> : null}
            </>
          ) : null}
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={submitting}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>{SUBMIT_LABELS[mode]}</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  readonlyRow: { gap: 2 },
  readonlyValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  mono: { fontFamily: fonts.mono, fontSize: 13 },
  multi: { height: 96, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  fileInfo: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
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
  actions: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
}));
