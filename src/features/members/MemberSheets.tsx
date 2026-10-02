import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import type { RoleSummary, SchoolUser } from './types';
import { BottomSheet, FooterButtons } from './parts';

/** Sentinel for "no custom role — reset to base role default" (maps to schoolRoleId: null). */
const BASE_DEFAULT = '__base_default__';

type AssignProps = {
  member: SchoolUser | null;
  roles: RoleSummary[];
  /** The currently logged-in user's own school-user id, to warn before self-reassignment. */
  currentUserId: string | undefined;
  onClose: () => void;
  onAssign: (memberId: string, schoolRoleId: string | null) => void;
};

export function AssignRoleSheet({ member, roles, currentUserId, onClose, onAssign }: AssignProps) {
  const [selected, setSelected] = useState<string>(BASE_DEFAULT);

  // The school-user list row doesn't carry a schoolRoleId — only the dynamic role's
  // display name (roleName), or null. Resolve a best-effort initial selection by name.
  const initialId = useMemo(() => {
    if (!member?.roleName) return BASE_DEFAULT;
    const match = roles.find((r) => r.name === member.roleName);
    return match ? match.id : BASE_DEFAULT;
  }, [member, roles]);

  useEffect(() => {
    setSelected(initialId);
  }, [initialId, member]);

  const commit = () => {
    if (!member) return;
    const schoolRoleId = selected === BASE_DEFAULT ? null : selected;
    onAssign(member.id, schoolRoleId);
    onClose();
  };

  const save = () => {
    if (!member) return;
    if (member.id === currentUserId) {
      Alert.alert(
        'Change your own access?',
        "You're about to change the role assigned to your own account. This may change what you can do here. Continue?",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'destructive', onPress: commit },
        ]
      );
      return;
    }
    commit();
  };

  return (
    <BottomSheet visible={!!member} title="Assign role" subtitle={member ? `${member.firstName} ${member.lastName}` : undefined} onClose={onClose}>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Pressable
          style={[styles.row, selected === BASE_DEFAULT && styles.rowOn]}
          onPress={() => setSelected(BASE_DEFAULT)}
        >
          <Ionicons
            name={selected === BASE_DEFAULT ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={selected === BASE_DEFAULT ? colors.primary : colors.textHint}
          />
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>Base role default</Text>
            <Text style={styles.rowSub} numberOfLines={1}>Reset to the default role for this account's base type</Text>
          </View>
        </Pressable>
        {roles.map((r) => {
          const on = r.id === selected;
          return (
            <Pressable key={r.id} style={[styles.row, on && styles.rowOn]} onPress={() => setSelected(r.id)}>
              <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={20} color={on ? colors.primary : colors.textHint} />
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>{r.name}</Text>
                {r.description ? <Text style={styles.rowSub} numberOfLines={1}>{r.description}</Text> : null}
              </View>
              {r.isDefault ? <Ionicons name="shield-checkmark-outline" size={16} color={colors.textHint} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <FooterButtons
        saveLabel="Assign"
        saveDisabled={!member || selected === initialId}
        onCancel={onClose}
        onSave={save}
      />
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
});
