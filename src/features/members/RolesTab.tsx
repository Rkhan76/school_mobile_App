import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { NewRoleModal } from './NewRoleModal';
import { RoleEditorModal } from './RoleEditorModal';
import { permissionCount, useRoleMemberCounts, useRoles } from './mockMembers';
import { SkeletonBlock } from './parts';

export function RolesTab() {
  const insets = useSafeAreaInsets();
  const { data: roles, isLoading, add, update, remove } = useRoles();
  const counts = useRoleMemberCounts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const editing = roles.find((r) => r.id === editingId) ?? null;

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
          <Pressable style={styles.addBtn} onPress={() => setNewOpen(true)} accessibilityLabel="New role">
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.addText}>New role</Text>
          </Pressable>
        </View>

        {isLoading
          ? [0, 1, 2, 3].map((i) => <SkeletonBlock key={i} height={96} />)
          : roles.map((r) => (
              <Pressable key={r.id} onPress={() => setEditingId(r.id)} accessibilityLabel={`Open role ${r.name}`}>
                <Card style={styles.card}>
                  <View style={styles.icon}>
                    <Ionicons name={r.readOnly ? 'lock-closed-outline' : 'shield-checkmark-outline'} size={20} color={colors.primaryDeep} />
                  </View>
                  <View style={styles.info}>
                    <View style={styles.titleRow}>
                      <Text style={styles.name} numberOfLines={1}>{r.name}</Text>
                      {r.system ? <Badge label={r.readOnly ? 'Read-only' : 'System'} tone="neutral" /> : <Badge label="Custom" tone="primary" />}
                    </View>
                    <Text style={styles.desc} numberOfLines={2}>{r.description}</Text>
                    <View style={styles.stats}>
                      <Text style={styles.stat}>{counts[r.id] ?? 0} members</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.stat}>{permissionCount(r)} permissions</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
                </Card>
              </Pressable>
            ))}
      </ScrollView>

      <RoleEditorModal
        role={editing}
        memberCount={editing ? counts[editing.id] ?? 0 : 0}
        existingNames={roles.map((r) => r.name)}
        onClose={() => setEditingId(null)}
        onSave={update}
        onDelete={remove}
      />
      <NewRoleModal
        visible={newOpen}
        roles={roles}
        onClose={() => setNewOpen(false)}
        onSubmit={(input) => {
          const role = add(input);
          setNewOpen(false);
          setEditingId(role.id);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
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
  stats: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  stat: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  dot: { color: colors.textHint },
});
