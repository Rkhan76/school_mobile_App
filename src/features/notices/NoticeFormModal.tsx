import { useEffect, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { audienceTone } from './AudiencePill';
import {
  AUDIENCES, TODAY_ISO, inputToIso, isoToInput, type Audience, type Notice, type NoticeInput,
} from './mockNotices';

type Props = {
  visible: boolean;
  /** null = add mode */
  notice: Notice | null;
  onSubmit: (input: NoticeInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'title' | 'content' | 'publishedAt' | 'expiresAt', string>>;

export function NoticeFormModal({ visible, notice, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<Audience>('ALL');
  const [published, setPublished] = useState('');
  const [expires, setExpires] = useState('');
  const [pinned, setPinned] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setTitle(notice?.title ?? '');
      setContent(notice?.content ?? '');
      setAudience(notice?.audience ?? 'ALL');
      setPublished(isoToInput(notice?.publishedAt ?? TODAY_ISO));
      setExpires(notice?.expiresAt ? isoToInput(notice.expiresAt) : '');
      setPinned(notice?.pinned ?? false);
      setErrors({});
    }
  }, [visible, notice]);

  const submit = () => {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Title is required.';
    if (!content.trim()) e.content = 'Content is required.';
    const pubIso = inputToIso(published);
    if (!pubIso) e.publishedAt = 'Enter a valid date as DD/MM/YYYY.';
    let expIso: string | null = null;
    if (expires.trim()) {
      expIso = inputToIso(expires);
      if (!expIso) e.expiresAt = 'Enter a valid date as DD/MM/YYYY.';
      else if (pubIso && expIso <= pubIso) e.expiresAt = 'Expiry must be after the published date.';
    }
    setErrors(e);
    if (Object.keys(e).length === 0 && pubIso) {
      onSubmit({ title: title.trim(), content: content.trim(), audience, publishedAt: pubIso, expiresAt: expIso, pinned });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close form">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>{notice ? 'Edit notice' : 'Add notice'}</Text>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="Notice title" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.title && styles.inputErr]}
          />
          {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}

          <Text style={styles.label}>Content *</Text>
          <TextInput
            value={content} onChangeText={setContent} placeholder="Write the notice..." placeholderTextColor={colors.textHint}
            multiline style={[styles.input, styles.multi, !!errors.content && styles.inputErr]}
          />
          {errors.content ? <Text style={styles.err}>{errors.content}</Text> : null}

          <Text style={styles.label}>Audience</Text>
          <View style={styles.chips}>
            {AUDIENCES.map((a) => {
              const on = a === audience;
              return (
                <Pressable
                  key={a} onPress={() => setAudience(a)}
                  style={[styles.chip, on && { backgroundColor: audienceTone[a].bg, borderColor: audienceTone[a].fg }]}
                >
                  <Text style={[styles.chipText, on && { color: audienceTone[a].fg }]}>{a}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.dates}>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Published date</Text>
              <TextInput
                value={published} onChangeText={setPublished} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
                keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.publishedAt && styles.inputErr]}
              />
              {errors.publishedAt ? <Text style={styles.err}>{errors.publishedAt}</Text> : null}
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.label}>Expires (optional)</Text>
              <TextInput
                value={expires} onChangeText={setExpires} placeholder="DD/MM/YYYY" placeholderTextColor={colors.textHint}
                keyboardType="numbers-and-punctuation" style={[styles.input, !!errors.expiresAt && styles.inputErr]}
              />
              {errors.expiresAt ? <Text style={styles.err}>{errors.expiresAt}</Text> : null}
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Pin this notice</Text>
              <Text style={styles.switchSub}>Pinned notices stay at the top.</Text>
            </View>
            <Switch
              value={pinned} onValueChange={setPinned}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white}
            />
          </View>

          <Pressable style={styles.attach} onPress={() => Alert.alert('Attachments', 'Attachments are coming soon.')}>
            <Ionicons name="attach" size={18} color={colors.primaryDeep} />
            <Text style={styles.attachText}>Add attachment</Text>
          </Pressable>
        </ScrollView>
        <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.save]} onPress={submit}>
            <Text style={styles.saveText}>{notice ? 'Save changes' : 'Add notice'}</Text>
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
  multi: { height: 140, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, justifyContent: 'center', borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  dates: { flexDirection: 'row', gap: 10 },
  dateCol: { flex: 1, gap: 6 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12, padding: 14,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  switchText: { flex: 1 },
  switchTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  switchSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  attach: {
    marginTop: 12, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
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
});
