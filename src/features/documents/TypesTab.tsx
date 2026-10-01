import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { ActionBtn, EmptyState, RoleTag, SkeletonList } from './parts';
import { TypeFormModal } from './TypeFormModal';
import { useDocumentTypes, type DocumentType } from './mockDocuments';

export function TypesTab() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, add, update, remove } = useDocumentTypes();
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentType | null>(null);

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);
  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const onDelete = useCallback((t: DocumentType) => {
    Alert.alert('Delete document type', `Delete "${t.name}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(t.id) },
    ]);
  }, [remove]);

  const showSkeleton = isLoading && !refreshing;

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.headRow}>
              <Text style={styles.count}>{data.length} document type{data.length === 1 ? '' : 's'}</Text>
              <Pressable style={styles.addBtn} onPress={() => { setEditing(null); setFormOpen(true); }} accessibilityLabel="Add document type">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.addText}>Add type</Text>
              </Pressable>
            </View>
            {showSkeleton ? <SkeletonList count={4} height={120} /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <Card style={{ gap: 10 }}>
              <View style={styles.top}>
                <View style={styles.icon}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primaryDeep} />
                </View>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              </View>
              <View style={styles.badges}>
                <Badge label={item.mandatory ? 'Mandatory' : 'Optional'} tone={item.mandatory ? 'danger' : 'neutral'} />
                <Badge label={item.expiryRequired ? 'Expiry required' : 'No expiry'} tone={item.expiryRequired ? 'warning' : 'neutral'} />
              </View>
              <View style={styles.applies}>
                <Text style={styles.appliesLabel}>Applies to</Text>
                {item.appliesTo.map((r) => <RoleTag key={r} role={r} />)}
              </View>
              <View style={styles.actions}>
                <ActionBtn label="Edit" icon="create-outline" onPress={() => { setEditing(item); setFormOpen(true); }} />
                <ActionBtn label="Delete" icon="trash-outline" tone="danger" onPress={() => onDelete(item)} />
              </View>
            </Card>
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : <EmptyState icon="folder-open-outline" title="No document types" sub="Add a type to start requesting documents." />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      />
      <TypeFormModal
        visible={formOpen}
        type={editing}
        existingNames={data.map((t) => t.name)}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => {
          if (editing) update(editing.id, input);
          else add(input);
          setFormOpen(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  addBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  addText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  itemWrap: { paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  name: { flex: 1, fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  applies: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  appliesLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
