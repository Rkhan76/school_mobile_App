import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { TeacherDetail, TeacherUpdatePayload } from './teacherDetail';

type Props = {
  visible: boolean;
  teacher: TeacherDetail;
  busy: boolean;
  onSubmit: (partial: TeacherUpdatePayload) => Promise<void>;
  onClose: () => void;
};

/** Lightweight inline edit — just the handful of fields that come up most often, not a
 * full rebuild of the create/edit form. */
export function EditTeacherModal({ visible, teacher, busy, onSubmit, onClose }: Props) {
  const [phone, setPhone] = useState(teacher.phone);
  const [qualification, setQualification] = useState(teacher.qualification);
  const [workLocation, setWorkLocation] = useState(teacher.workLocation);

  useEffect(() => {
    if (visible) {
      setPhone(teacher.phone === '—' ? '' : teacher.phone);
      setQualification(teacher.qualification === '—' ? '' : teacher.qualification);
      setWorkLocation(teacher.workLocation === '—' ? '' : teacher.workLocation);
    }
  }, [visible, teacher]);

  const save = async () => {
    await onSubmit({
      personalInfo: {
        phone: phone.trim() || undefined,
        qualification: qualification.trim() || undefined,
        workLocation: workLocation.trim() || undefined,
      },
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.box}>
          <Text style={styles.title}>Edit profile</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.textHint}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Qualification</Text>
            <TextInput
              value={qualification}
              onChangeText={setQualification}
              placeholder="e.g. M.Sc Mathematics, B.Ed"
              placeholderTextColor={colors.textHint}
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Work location</Text>
            <TextInput
              value={workLocation}
              onChangeText={setWorkLocation}
              placeholder="e.g. Main Campus"
              placeholderTextColor={colors.textHint}
              style={styles.input}
            />
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose} disabled={busy}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.save, busy && styles.disabled]} disabled={busy} onPress={save}>
              {busy ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.saveText}>Save</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'center', padding: 20 },
  box: { backgroundColor: colors.cardSolid, borderRadius: radius.xl, padding: 20, gap: 12 },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  field: { gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.4, color: colors.textHint, textTransform: 'uppercase' },
  input: {
    height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primaryDeep },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
  disabled: { opacity: 0.6 },
});
