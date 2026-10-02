import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { PERMISSION_GROUPS, permissionCount, type Member, type Role } from './mockMembers';
import { hasPermission } from './permissions';
import { BottomSheet, FooterButtons } from './parts';

/* ------------------------------ Assign role ------------------------------ */

type AssignProps = { member: Member | null; roles: Role[]; onClose: () => void; onAssign: (memberId: string, roleId: string) => void };

export function AssignRoleSheet({ member, roles, onClose, onAssign }: AssignProps) {
  const [selected, setSelected] = useState('');
  useEffect(() => { if (member) setSelected(member.roleId); }, [member]);

  return (
    <BottomSheet visible={!!member} title="Assign role" subtitle={member?.name} onClose={onClose}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {roles.map((r) => {
          const on = r.id === selected;
          return (
            <Pressable key={r.id} style={[styles.row, on && styles.rowOn]} onPress={() => setSelected(r.id)}>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.primary : colors.textHint} />
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{r.name}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{permissionCount(r)} permissions</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <FooterButtons
        saveLabel="Assign"
        saveDisabled={!member || selected === member.roleId}
        onCancel={onClose}
        onSave={() => { if (member) { onAssign(member.id, selected); onClose(); } }}
      />
    </BottomSheet>
  );
}

/* ------------------------------ Permission preview ------------------------------ */

type PreviewProps = { member: Member | null; role: Role | undefined; onClose: () => void };

export function MemberPermissionsSheet({ member, role, onClose }: PreviewProps) {
  return (
    <BottomSheet
      visible={!!member}
      title="Permissions"
      subtitle={member && role ? `${member.name} · ${role.name} (${permissionCount(role)} granted)` : undefined}
      onClose={onClose}
    >
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {role
          ? PERMISSION_GROUPS.map((g) => {
              const granted = g.permissions.filter((x) => hasPermission(x.code, role.permissions));
              return (
                <View key={g.key} style={styles.group}>
                  <View style={styles.groupHead}>
                    <Ionicons name={g.icon} size={16} color={colors.primaryDeep} />
                    <Text style={styles.groupTitle}>{g.label}</Text>
                    <Text style={styles.groupCount}>{granted.length}/{g.permissions.length}</Text>
                  </View>
                  {g.permissions.map((x) => {
                    const ok = hasPermission(x.code, role.permissions);
                    return (
                      <View key={x.code} style={styles.permRow}>
                        <Ionicons name={ok ? 'checkmark-circle' : 'close-circle-outline'} size={16} color={ok ? colors.success : colors.textHint} />
                        <Text style={[styles.code, !ok && styles.codeOff]} numberOfLines={1}>{x.code}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })
          : null}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flexGrow: 0, marginBottom: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 8,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.mintSoft },
  rowTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  rowSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  group: {
    padding: 12, marginBottom: 10, gap: 6, borderRadius: radius.lg,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  groupTitle: { flex: 1, fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  groupCount: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { flex: 1, fontFamily: fonts.mono, fontSize: 11.5, color: colors.text },
  codeOff: { color: colors.textHint },
});
