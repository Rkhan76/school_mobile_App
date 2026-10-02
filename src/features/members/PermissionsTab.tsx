import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts } from '../../theme/tokens';
import { EmptyState } from './parts';
import { usePermissionCatalog } from './useMembers';

/** Read-only reference catalog of every fixed permission code, grouped by module. */
export function PermissionsTab() {
  const insets = useSafeAreaInsets();
  const { groups, isLoading } = usePermissionCatalog();
  const [search, setSearch] = useState('');

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (x) => !q || x.code.toLowerCase().includes(q) || x.description.toLowerCase().includes(q) || g.module.toLowerCase().includes(q)
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
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : visible.length === 0 ? (
        <EmptyState icon="key-outline" title="No permissions found" sub="Try a different search term." />
      ) : (
        visible.map((g) => (
          <Card key={g.module} style={styles.card}>
            <View style={styles.head}>
              <Ionicons name="key-outline" size={18} color={colors.primaryDeep} />
              <Text style={styles.title}>{g.module}</Text>
              <Text style={styles.count}>{g.permissions.length}</Text>
            </View>
            {g.permissions.map((x) => (
              <View key={x.code} style={styles.row}>
                <Text style={styles.code}>{x.code}</Text>
                <Text style={styles.label}>{x.description}</Text>
              </View>
            ))}
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
  title: { flex: 1, fontFamily: fonts.heading, fontSize: 16, color: colors.text, textTransform: 'capitalize' },
  count: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  row: { gap: 3, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  code: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  label: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
