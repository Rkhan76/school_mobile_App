import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import type { RoleDetail, RoleSummary, UpdateRolePayload } from './types';
import { Checkbox, FooterButtons, FullModal, formStyles as f } from './parts';
import type { PermissionCatalogGroup } from './useMembers';
import { useRoleDetail } from './useMembers';

type Props = {
  roleId: string | null;
  roles: RoleSummary[];
  sessionPermissions: string[];
  permissionGroups: PermissionCatalogGroup[];
  onClose: () => void;
  onSave: (id: string, patch: UpdateRolePayload) => Promise<RoleDetail | null>;
  onDelete: (id: string) => Promise<boolean>;
};

export function RoleEditorModal({ roleId, roles, sessionPermissions, permissionGroups, onClose, onSave, onDelete }: Props) {
  const { detail, isLoading } = useRoleDetail(roleId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hiddenGranted, setHiddenGranted] = useState<string[]>([]);
  const [nameErr, setNameErr] = useState('');
  const [saving, setSaving] = useState(false);

  // The default ADMIN role's permission set can't be changed via the API at all —
  // only name/description. Other default roles (Teacher/Student/Parent/Staff) aren't locked.
  const locked = !!detail && detail.isDefault && detail.baseRole === 'ADMIN';
  const sessionSet = useMemo(() => new Set(sessionPermissions), [sessionPermissions]);

  useEffect(() => {
    if (detail) {
      setName(detail.name);
      setDescription(detail.description ?? '');
      const codes = detail.rolePermissions.map((rp) => rp.permission.code);
      // Only codes the current viewer themselves holds are editable (the backend 403s
      // on granting beyond your own permissions) — anything else stays untouched.
      setSelected(new Set(codes.filter((c) => sessionSet.has(c))));
      setHiddenGranted(codes.filter((c) => !sessionSet.has(c)));
      setNameErr('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail]);

  const toggle = (code: string) => {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const toggleGroup = (codes: string[]) => {
    if (locked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const all = codes.every((c) => next.has(c));
      codes.forEach((c) => (all ? next.delete(c) : next.add(c)));
      return next;
    });
  };

  const others = useMemo(
    () => roles.filter((r) => r.id !== roleId).map((r) => r.name.toLowerCase()),
    [roles, roleId]
  );

  const visibleGroups = useMemo(
    () =>
      permissionGroups
        .map((g) => ({ ...g, permissions: g.permissions.filter((p) => sessionSet.has(p.code)) }))
        .filter((g) => g.permissions.length > 0),
    [permissionGroups, sessionSet]
  );

  const save = async () => {
    if (!detail) return;
    const n = name.trim();
    if (!n) {
      setNameErr('Role name is required.');
      return;
    }
    if (others.includes(n.toLowerCase())) {
      setNameErr('A role with this name already exists.');
      return;
    }

    setSaving(true);
    try {
      const patch: UpdateRolePayload = { name: n, description: description.trim() || undefined };
      if (!locked) {
        // Preserve any permissions outside the viewer's own access that were already
        // granted — only the visible, editable subset is actually toggled here.
        patch.permissions = Array.from(new Set([...Array.from(selected), ...hiddenGranted]));
      }
      const result = await onSave(detail.id, patch);
      if (result) onClose();
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!detail) return;
    Alert.alert('Delete role', `Delete "${detail.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await onDelete(detail.id);
          if (ok) onClose();
        },
      },
    ]);
  };

  return (
    <FullModal
      visible={!!roleId}
      title={detail ? `Edit role · ${detail.name}` : 'Role'}
      onClose={onClose}
      footer={
        detail ? (
          <FooterButtons saveLabel={saving ? 'Saving…' : 'Save changes'} saveDisabled={saving} onCancel={onClose} onSave={save} />
        ) : undefined
      }
    >
      {isLoading || !detail ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[f.form, styles.pad]}>
          {locked ? (
            <View style={styles.banner}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.warning} />
              <Text style={styles.bannerText}>
                The default Admin role always has every permission — its permission set can't be changed here, only its name and description.
              </Text>
            </View>
          ) : null}

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

          {!locked && hiddenGranted.length > 0 ? (
            <Text style={styles.hiddenNote}>
              This role also holds {hiddenGranted.length} permission(s) outside your own access — they're left untouched by any change you make here.
            </Text>
          ) : null}

          {visibleGroups.map((g) => {
            const codes = g.permissions.map((x) => x.code);
            const count = codes.filter((c) => selected.has(c)).length;
            const allOn = count === codes.length;
            return (
              <View key={g.module} style={styles.group}>
                <Pressable style={styles.groupHead} onPress={() => toggleGroup(codes)} disabled={locked}>
                  <View style={styles.flex}>
                    <Text style={styles.groupTitle}>{g.module}</Text>
                    <Text style={styles.groupSub}>{count} of {codes.length} selected</Text>
                  </View>
                  <Text style={styles.selectAll}>{allOn ? 'Clear all' : 'Select all'}</Text>
                  <Checkbox checked={allOn} disabled={locked} />
                </Pressable>
                {g.permissions.map((x) => (
                  <Pressable key={x.code} style={styles.permRow} onPress={() => toggle(x.code)} disabled={locked}>
                    <Checkbox checked={selected.has(x.code)} disabled={locked} />
                    <View style={styles.flex}>
                      <Text style={styles.permLabel}>{x.description}</Text>
                      <Text style={styles.code}>{x.code}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            );
          })}

          {!detail.isDefault ? (
            <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
              <Text style={styles.deleteText}>Delete role</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </FullModal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { gap: 10 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.lg,
    backgroundColor: colors.warningBg,
  },
  bannerText: { flex: 1, fontFamily: fonts.body, fontSize: 12, color: colors.warning },
  hiddenNote: { fontFamily: fonts.body, fontSize: 11.5, color: colors.textHint, marginTop: 2 },
  group: {
    padding: 12, gap: 4, borderRadius: radius.lg, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border,
  },
  groupHead: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  groupTitle: { fontFamily: fonts.heading, fontSize: 15, color: colors.text, textTransform: 'capitalize' },
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
