import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { AddMemberModal } from './AddMemberModal';
import { MemberCard } from './MemberCard';
import { AssignRoleSheet } from './MemberSheets';
import { Chip, EmptyState, SkeletonBlock } from './parts';
import { canActOnCredentials, ROLE_FILTER_OPTIONS, type SchoolUser, type SchoolUserBaseRole } from './types';
import { useMembers, useRoles } from './useMembers';

export function MembersTab() {
  const insets = useSafeAreaInsets();
  const { permissions, user } = useSession();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [role, setRole] = useState<SchoolUserBaseRole | ''>('');
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [assigning, setAssigning] = useState<SchoolUser | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const canResendInvite = permissions.includes('school-user.invite.create');
  const canResetPassword = permissions.includes('school-user.password.update');
  const canResetPasswordPlaintext = permissions.includes('school-user.password-plaintext.update');
  const canToggleBlock = permissions.includes('school-user.profile.delete');
  const canAssignRole = permissions.includes('rbac.user-role.update');

  const { data: roles } = useRoles();
  const {
    data,
    total,
    stats,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refetch,
    resendInvite,
    resetPassword,
    resetPasswordPlaintext,
    toggleBlock,
    assignRole,
  } = useMembers({ search: debounced, role });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const onAssign = useCallback((m: SchoolUser) => setAssigning(m), []);

  const onResendInvite = useCallback(
    (m: SchoolUser) => {
      Alert.alert('Resend invite', `Resend the invite email to ${m.firstName} ${m.lastName}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resend', onPress: () => resendInvite(m.id) },
      ]);
    },
    [resendInvite]
  );

  const onResetPassword = useCallback(
    (m: SchoolUser) => {
      if (m.email) {
        Alert.alert(
          'Reset password',
          `Send a password reset link to ${m.firstName} ${m.lastName}? This revokes all of their active sessions.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Send link', style: 'destructive', onPress: () => resetPassword(m.id) },
          ]
        );
        return;
      }
      Alert.alert(
        'Set temporary password',
        `${m.firstName} ${m.lastName} has no email on file — this will set a new temporary password directly and revoke all active sessions. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set password',
            style: 'destructive',
            onPress: async () => {
              const res = await resetPasswordPlaintext(m.id);
              if (res) {
                Alert.alert(
                  'Temporary password set',
                  `Username: ${res.username}\nTemporary password: ${res.temporaryPassword}\n\nShare this with them now — it will not be shown again.`
                );
              }
            },
          },
        ]
      );
    },
    [resetPassword, resetPasswordPlaintext]
  );

  const onToggleBlock = useCallback(
    (m: SchoolUser) => {
      const blocking = m.status === 'ACTIVE';
      Alert.alert(
        blocking ? 'Block account' : 'Unblock account',
        blocking
          ? `Block ${m.firstName} ${m.lastName}? This deactivates their profile and portal login and revokes all active sessions.`
          : `Unblock ${m.firstName} ${m.lastName}? They will be able to sign in again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: blocking ? 'Block' : 'Unblock', style: blocking ? 'destructive' : 'default', onPress: () => toggleBlock(m.id) },
        ]
      );
    },
    [toggleBlock]
  );

  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.stats}>
        <StatTile label="Total Members" value={String(stats.total)} icon="people-outline" />
        <StatTile label="Loaded" value={String(data.length)} icon="layers-outline" tint={colors.blue} />
        <StatTile label="Active (loaded)" value={String(stats.activeLoaded)} icon="shield-checkmark-outline" tint={colors.indigo} />
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or email..." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="All" on={role === ''} onPress={() => setRole('')} />
        {ROLE_FILTER_OPTIONS.map((r) => (
          <Chip key={r.value} label={r.label} on={role === r.value} onPress={() => setRole(r.value)} />
        ))}
      </ScrollView>

      <View style={styles.toolbar}>
        <View style={styles.count}>
          <Ionicons name="people-outline" size={16} color={colors.primaryDeep} />
          <Text style={styles.countText}>{total} members</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setAddOpen(true)} accessibilityLabel="Add member">
          <Ionicons name="person-add-outline" size={16} color={colors.white} />
          <Text style={styles.addText}>Add member</Text>
        </Pressable>
      </View>

      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2, 3].map((i) => <SkeletonBlock key={i} height={170} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(m) => m.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => {
          const rankOk = canActOnCredentials(user?.id, user?.role, item);
          return (
            <View style={styles.itemWrap}>
              <MemberCard
                member={item}
                canAssignRole={canAssignRole}
                canResendInvite={canResendInvite && rankOk}
                canResetPassword={canResetPassword && rankOk}
                canResetPasswordPlaintext={canResetPasswordPlaintext && rankOk}
                canToggleBlock={canToggleBlock && rankOk}
                onAssign={onAssign}
                onResendInvite={onResendInvite}
                onResetPassword={onResetPassword}
                onToggleBlock={onToggleBlock}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          showSkeleton ? null : (
            <EmptyState icon="people-outline" title="No members found" sub="Try changing the search or role filter." />
          )
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
        onEndReached={() => { if (hasMore) loadMore(); }}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />

      <AddMemberModal visible={addOpen} onClose={() => setAddOpen(false)} />
      <AssignRoleSheet
        member={assigning}
        roles={roles}
        currentUserId={user?.id}
        onClose={() => setAssigning(null)}
        onAssign={assignRole}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  stats: { flexDirection: 'row', gap: 8 },
  chips: { gap: 8, paddingVertical: 2 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  count: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  addBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
});
