import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { ALL_PERMISSION_CODES, PERMISSION_GROUPS, type Role, type RolePatch } from './mockMembers';
import { hasPermission } from './permissions';
import { Checkbox, FooterButtons, FullModal, formStyles as f } from './parts';

type Props = {
  role: Role | null;
  memberCount: number;
  existingNames: string[];
  onClose: () => void;
  onSave: (id: string, patch: RolePatch) => void;
  onDelete: (id: string) => void;
};

export function RoleEditorModal({ role, memberCount, existingNames, onClose, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nameErr, setNameErr] = useState('');

  const readOnly = !!role?.readOnly;

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setSelected(new Set(ALL_PERMISSION_CODES.filter((c) => hasPermission(c, role.permissions))));
      setNameErr('');
    }
  }, [role]);

  const toggle = (code: string) => {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleGroup = (codes: string[]) => {
    if (readOnly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const all = codes.every((c) => next.has(c));
      codes.forEach((c) => (all ? next.delete(c) : next.add(c)));
      return next;
    });
  };

  const others = useMemo(
    () => existingNames.filter((n) => role && n.toLowerCase() !== role.name.toLowerCase()).map((n) => n.toLowerCase()),
    [existingNames, role],
  );

  const save = () => {
    if (!role) return;
    if (!role.system) {
      if (!name.trim()) { setNameErr('Role name is required.'); return; }
      if (others.includes(name.trim().toLowerCase())) { setNameErr('A role with this name already exists.'); return; }
    }
    onSave(role.id, {
      ...(role.system ? {} : { name: name.trim(), description: description.trim() || 'Custom role' }),
      permissions: ALL_PERMISSION_CODES.filter((c) => selected.has(c)),
    });
    onClose();
  };

  const confirmDelete = () => {
    if (!role) return;
    if (memberCount > 0) {
      Alert.alert('Cannot delete role', `${memberCount} member(s) still have this role. Reassign them first.`);
      return;
    }
    Alert.alert('Delete role', `Delete "${role.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { onDelete(role.id); onClose(); } },
    ]);
  };

  return (
    <FullModal
      visible={!!role}
      title={role ? `${readOnly ? 'View' : 'Edit'} role · ${role.name}` : ''}
      onClose={onClose}
      footer={
        readOnly
          ? <FooterButtons cancelLabel="Close" saveLabel="Read-only" saveDisabled onCancel={onClose} onSave={onClose} />
          : <FooterButtons saveLabel="Save changes" onCancel={onClose} onSave={save} />
      }
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[f.form, styles.pad]}>
        {readOnly ? (
          <View style={styles.banner}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
            <Text style={styles.bannerText}>The admin role always has every permission and cannot be edited.</Text>
          </View>
        ) : null}

        {role && !role.system ? (
          <>
            <Text style={f.label}>Role name *</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="Role name" placeholderTextColor={colors.textHint}
              style={[f.input, !!nameErr && f.inputErr]}
            />
            {nameErr ? <Text style={f.err}>{nameErr}</Text> : null}
            <Text style={f.label}>Description</Text>
            <TextInput
              value={description} onChangeText={setDescription} placeholder="What is this role for?"
              placeholderTextColor={colors.textHint} style={f.input}
            />
          </>
        ) : null}

        {PERMISSION_GROUPS.map((g) => {
          const codes = g.permissions.map((x) => x.code);
          const count = codes.filter((c) => selected.has(c)).length;
          const allOn = count === codes.length;
          return (
            <View key={g.key} style={styles.group}>
              <Pressable style={styles.groupHead} onPress={() => toggleGroup(codes)} disabled={readOnly}>
                <Ionicons name={g.icon} size={18} color={colors.primaryDeep} />
                <View style={styles.flex}>
                  <Text style={styles.groupTitle}>{g.label}</Text>
                  <Text style={styles.groupSub}>{count} of {codes.length} selected</Text>
                </View>
                <Text style={styles.selectAll}>{allOn ? 'Clear all' : 'Select all'}</Text>
                <Checkbox checked={allOn} disabled={readOnly} />
              </Pressable>
              {g.permissions.map((x) => (
                <Pressable key={x.code} style={styles.permRow} onPress={() => toggle(x.code)} disabled={readOnly}>
                  <Checkbox checked={selected.has(x.code)} disabled={readOnly} />
                  <View style={styles.flex}>
                    <Text style={styles.permLabel}>{x.label}</Text>
                    <Text style={styles.code}>{x.code}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          );
        })}

        {role && !role.system ? (
          <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.deleteText}>Delete role</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </FullModal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { gap: 10 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.lg,
    backgroundColor: colors.warningBg,
  },
  bannerText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.warning },
  group: {
    padding: 12, gap: 4, borderRadius: radius.lg, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border,
  },
  groupHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  groupTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  groupSub: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
  selectAll: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  permLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  code: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  deleteBtn: {
    height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6,
    borderRadius: radius.lg, backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder,
  },
  deleteText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.danger },
});
