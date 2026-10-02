import { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { View } from 'react-native';
import { colors } from '../../theme/tokens';
import type { MemberInput, Role } from './mockMembers';
import { Chip, FooterButtons, FullModal, formStyles as f } from './parts';

type Props = { visible: boolean; roles: Role[]; onClose: () => void; onSubmit: (input: MemberInput) => void };
type Errors = Partial<Record<'firstName' | 'lastName' | 'email' | 'phone' | 'roleId', string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function AddMemberModal({ visible, roles, onClose, onSubmit }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (visible) {
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setRoleId(''); setErrors({});
    }
  }, [visible]);

  const submit = () => {
    const e: Errors = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim()) e.lastName = 'Last name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) e.email = 'Enter a valid email address.';
    if (!/^\d{10}$/.test(phone)) e.phone = 'Phone must be exactly 10 digits.';
    if (!roleId) e.roleId = 'Choose a role.';
    setErrors(e);
    if (Object.keys(e).length === 0) onSubmit({ firstName, lastName, email, phone, roleId });
  };

  return (
    <FullModal
      visible={visible}
      title="Add member"
      onClose={onClose}
      footer={<FooterButtons saveLabel="Add member" onCancel={onClose} onSave={submit} />}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={f.form}>
        <Text style={f.label}>First name *</Text>
        <TextInput
          value={firstName} onChangeText={setFirstName} placeholder="First name" placeholderTextColor={colors.textHint}
          style={[f.input, !!errors.firstName && f.inputErr]}
        />
        {errors.firstName ? <Text style={f.err}>{errors.firstName}</Text> : null}

        <Text style={f.label}>Last name *</Text>
        <TextInput
          value={lastName} onChangeText={setLastName} placeholder="Last name" placeholderTextColor={colors.textHint}
          style={[f.input, !!errors.lastName && f.inputErr]}
        />
        {errors.lastName ? <Text style={f.err}>{errors.lastName}</Text> : null}

        <Text style={f.label}>Email *</Text>
        <TextInput
          value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor={colors.textHint}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          style={[f.input, !!errors.email && f.inputErr]}
        />
        {errors.email ? <Text style={f.err}>{errors.email}</Text> : null}

        <Text style={f.label}>Phone (10 digits) *</Text>
        <TextInput
          value={phone} onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))} placeholder="9800000000"
          placeholderTextColor={colors.textHint} keyboardType="number-pad" maxLength={10}
          style={[f.input, !!errors.phone && f.inputErr]}
        />
        {errors.phone ? <Text style={f.err}>{errors.phone}</Text> : null}

        <Text style={f.label}>Role *</Text>
        <View style={f.chips}>
          {roles.map((r) => <Chip key={r.id} label={r.name} on={r.id === roleId} onPress={() => setRoleId(r.id)} />)}
        </View>
        {errors.roleId ? <Text style={f.err}>{errors.roleId}</Text> : null}
      </ScrollView>
    </FullModal>
  );
}
