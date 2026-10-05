import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { NewRoleModal } from './NewRoleModal';
import { RoleEditorModal } from './RoleEditorModal';
import { SkeletonBlock } from './parts';
import { usePermissionCatalog, useRoles } from './useMembers';

export function RolesTab() {
  const insets = useSafeAreaInsets();
  const { permissions } = useSession();
  const canCreate = permissions.includes('rbac.role.create');

  const { data: roles, isLoading, add, update, remove } = useRoles();
  const { groups } = usePermissionCatalog();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toolbar}>
          <View style={styles.count}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primaryDeep} />
            <Text style={styles.countText}>{roles.length} roles</Text>
          </View>
          {canCreate ? (
            <Pressable style={styles.addBtn} onPress={() => setNewOpen(true)} accessibilityLabel="New role">
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.addText}>New role</Text>
            </Pressable>
          ) : null}
        </View>

        {isLoading
          ? [0, 1, 2, 3].map((i) => <SkeletonBlock key={i} height={96} />)
          : roles.map((r) => (
              <Pressable key={r.id} onPress={() => setEditingId(r.id)} accessibilityLabel={`Open role ${r.name}`}>
                <Card style={styles.card}>
                  <View style={styles.icon}>
                    <Ionicons name={r.isDefault ? 'lock-closed-outline' : 'shield-checkmark-outline'} size={20} color={colors.primaryDeep} />
                  </View>
                  <View style={styles.info}>
                    <View style={styles.titleRow}>
                      <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
                      {r.isDefault ? <Badge label="Default" tone="neutral" /> : <Badge label="Custom" tone="primary" />}
                    </View>
                    {r.description ? <Text style={styles.desc} numberOfLines={2}>{r.description}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
                </Card>
              </Pressable>
            ))}
      </ScrollView>

      <RoleEditorModal
        roleId={editingId}
        roles={roles}
        sessionPermissions={permissions}
        permissionGroups={groups}
        onClose={() => setEditingId(null)}
        onSave={update}
        onDelete={remove}
      />
      <NewRoleModal
        visible={newOpen}
        roles={roles}
        sessionPermissions={permissions}
        onClose={() => setNewOpen(false)}
        onSubmit={async (input) => {
          const role = await add(input);
          setNewOpen(false);
          if (role) setEditingId(role.id);
        }}
      />
    </>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  addBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  info: { flex: 1, minWidth: 0, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, flexShrink: 1 },
  desc: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
}));
