import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts, themed } from '../../theme/tokens';
import { getRole } from './api';
import { errorMessage } from './useMembers';
import type { RoleSummary } from './types';
import { Chip, FooterButtons, FullModal, formStyles as f } from './parts';

type NewRoleInput = { name: string; description?: string; permissions: string[] };

type Props = {
  visible: boolean;
  roles: RoleSummary[];
  /** The current user's own granted permission codes — only these can be copied in (403 otherwise). */
  sessionPermissions: string[];
  onClose: () => void;
  onSubmit: (input: NewRoleInput) => void;
};

/**
 * Creation only covers name/description/"copy from" — the full permission
 * checkbox grid lives in RoleEditorModal, opened immediately after creation so
 * the admin can fine-tune the grant list there.
 */
export function NewRoleModal({ visible, roles, sessionPermissions, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copyFromId, setCopyFromId] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(''); setDescription(''); setCopyFromId(''); setErr(''); setSubmitting(false);
    }
  }, [visible]);

  const submit = async () => {
    const n = name.trim();
    if (!n) { setErr('Role name is required.'); return; }
    if (roles.some((r) => r.name.toLowerCase() === n.toLowerCase())) { setErr('A role with this name already exists.'); return; }

    setSubmitting(true);
    try {
      let permissions: string[] = [];
      if (copyFromId) {
        const source = await getRole(copyFromId);
        const sourceCodes = source.rolePermissions.map((rp) => rp.permission.code);
        // You can only grant codes you yourself hold — only copy the overlap.
        permissions = sourceCodes.filter((c) => sessionPermissions.includes(c));
      }
      onSubmit({ name: n, description: description.trim() || undefined, permissions });
    } catch (error) {
      setErr(errorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FullModal
      visible={visible}
      title="New role"
      onClose={onClose}
      footer={<FooterButtons saveLabel={submitting ? 'Creating…' : 'Create role'} saveDisabled={submitting} onCancel={onClose} onSave={submit} />}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={f.form}>
        <Text style={f.label}>Role name *</Text>
        <TextInput
          value={name} onChangeText={(v) => { setName(v); setErr(''); }} placeholder="e.g. Librarian"
          placeholderTextColor={colors.textHint} style={[f.input, !!err && f.inputErr]}
        />
        {err ? <Text style={f.err}>{err}</Text> : null}

        <Text style={f.label}>Description</Text>
        <TextInput
          value={description} onChangeText={setDescription} placeholder="What is this role for?"
          placeholderTextColor={colors.textHint} style={f.input}
        />

        <Text style={f.label}>Copy permissions from</Text>
        <View style={f.chips}>
          <Chip label="None" on={copyFromId === ''} onPress={() => setCopyFromId('')} />
          {roles.map((r) => <Chip key={r.id} label={r.name} on={copyFromId === r.id} onPress={() => setCopyFromId(r.id)} />)}
        </View>
        <Text style={styles.hint}>Only permissions you yourself hold can be copied in — you can add more after creating the role.</Text>
      </ScrollView>
    </FullModal>
  );
}

const styles = themed(() => StyleSheet.create({
  hint: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textHint, marginTop: 4 },
}));
