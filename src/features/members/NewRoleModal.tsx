import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../../theme/tokens';
import type { Role, RoleInput } from './mockMembers';
import { Chip, FooterButtons, FullModal, formStyles as f } from './parts';

type Props = { visible: boolean; roles: Role[]; onClose: () => void; onSubmit: (input: RoleInput) => void };

export function NewRoleModal({ visible, roles, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [copyFromId, setCopyFromId] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (visible) { setName(''); setDescription(''); setCopyFromId(''); setErr(''); }
  }, [visible]);

  const submit = () => {
    const n = name.trim();
    if (!n) { setErr('Role name is required.'); return; }
    if (roles.some((r) => r.name.toLowerCase() === n.toLowerCase())) { setErr('A role with this name already exists.'); return; }
    onSubmit({ name: n, description, copyFromId: copyFromId || undefined });
  };

  return (
    <FullModal
      visible={visible}
      title="New role"
      onClose={onClose}
      footer={<FooterButtons saveLabel="Create role" onCancel={onClose} onSave={submit} />}
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
      </ScrollView>
    </FullModal>
  );
}
