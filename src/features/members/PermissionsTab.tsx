import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { useRoles, usePermissionCatalog } from './mockMembers';
import { hasPermission } from './permissions';
import { EmptyState } from './parts';

/** Read-only catalog of every permission code and the roles that hold it. */
export function PermissionsTab() {
  const insets = useSafeAreaInsets();
  const { data: groups } = usePermissionCatalog();
  const { data: roles } = useRoles();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (x) => !q || x.code.toLowerCase().includes(q) || x.label.toLowerCase().includes(q) || g.label.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, search]);

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search permission codes..." />
      {visible.length === 0 ? (
        <EmptyState icon="key-outline" title="No permissions found" sub="Try a different search term." />
      ) : (
        visible.map((g) => (
          <Card key={g.key} style={styles.card}>
            <View style={styles.head}>
              <Ionicons name={g.icon} size={18} color={colors.primaryDeep} />
              <Text style={styles.title}>{g.label}</Text>
              <Text style={styles.count}>{g.permissions.length}</Text>
            </View>
            {g.permissions.map((x) => {
              const holders = roles.filter((r) => hasPermission(x.code, r.permissions));
              return (
                <View key={x.code} style={styles.row}>
                  <Text style={styles.code}>{x.code}</Text>
                  <Text style={styles.label}>{x.label}</Text>
                  <View style={styles.chips}>
                    {holders.length === 0 ? (
                      <Text style={styles.none}>No roles</Text>
                    ) : (
                      holders.map((r) => (
                        <View key={r.id} style={styles.chip}>
                          <Text style={styles.chipText}>{r.name}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 12 },
  card: { padding: 14, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  row: { gap: 3, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  code: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.mint },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.primaryDeep },
  none: { fontFamily: fonts.body, fontSize: 11, color: colors.textHint },
});
