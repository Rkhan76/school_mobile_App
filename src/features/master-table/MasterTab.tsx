import { useMemo, useState, type ReactElement } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { TabConfig } from './config';
import { FormModal } from './FormModal';
import { MasterCard } from './MasterCard';
import { useMasterData } from './useMasterData';
import type { MasterEntityMap, TabKey } from './types';

type ModalState<K extends TabKey> = { mode: 'add' } | { mode: 'edit'; item: MasterEntityMap[K] } | null;

/** Generic list for one master tab, driven entirely by its config. */
export function MasterTab<K extends TabKey>({ config, header }: { config: TabConfig<K>; header: ReactElement }) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, add, update, remove, setActive } = useMasterData(config.key);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalState<K>>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? data.filter((e) => config.searchText(e).toLowerCase().includes(q)) : data;
  }, [data, search, config]);

  const confirmDelete = (e: MasterEntityMap[K]) => {
    const block = config.deleteBlock?.(e) ?? null;
    if (block) {
      Alert.alert('Cannot delete', block);
      return;
    }
    Alert.alert(`Delete ${config.singular}`, `Delete "${config.view(e).title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(e.id) },
    ]);
  };

  const confirmSetActive = (e: MasterEntityMap[K]) => {
    Alert.alert('Set Active', `Make "${config.view(e).title}" the active academic year?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Set Active', onPress: () => setActive(e.id) },
    ]);
  };

  const submit = (values: Parameters<TabConfig<K>['toDraft']>[0]) => {
    if (modal?.mode === 'edit') update(modal.item.id, config.toDraft(values, modal.item));
    else add(config.toDraft(values));
    setModal(null);
  };

  const toggleCfg = config.toggle;

  return (
    <>
      <FlatList
        data={isLoading ? [] : filtered}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={
          <View>
            {header}
            <View style={styles.toolbar}>
              <View style={styles.toolbarRow}>
                <Text style={styles.count}>{isLoading ? ' ' : `${filtered.length} ${filtered.length === 1 ? 'record' : 'records'}`}</Text>
                <Pressable style={styles.iconBtn} onPress={refetch} accessibilityLabel="Refresh">
                  <Ionicons name="refresh" size={19} color={colors.textSecondary} />
                </Pressable>
                <Pressable style={styles.newBtn} onPress={() => setModal({ mode: 'add' })}>
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.newText} numberOfLines={1}>New {config.singular}</Text>
                </Pressable>
              </View>
              <SearchBar value={search} onChangeText={setSearch} placeholder={config.searchPlaceholder} />
            </View>
            {isLoading ? (
              <View style={styles.pad}>
                {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.pad}>
            <MasterCard
              view={config.view(item)}
              toggle={toggleCfg ? {
                label: toggleCfg.label,
                value: toggleCfg.get(item),
                onChange: (on) => update(item.id, toggleCfg.patch(on)),
              } : undefined}
              onSetActive={config.canSetActive?.(item) ? () => confirmSetActive(item) : undefined}
              onEdit={() => setModal({ mode: 'edit', item })}
              onDelete={() => confirmDelete(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <Ionicons name={config.icon} size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No {config.label.toLowerCase()} found</Text>
              <Text style={styles.emptySub}>{search ? 'Try a different search.' : `Tap "New ${config.singular}" to add one.`}</Text>
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <FormModal
        visible={modal !== null}
        title={modal?.mode === 'edit' ? `Edit ${config.singular}` : `New ${config.singular}`}
        submitLabel={modal?.mode === 'edit' ? 'Save' : 'Create'}
        fields={config.fields}
        initial={modal?.mode === 'edit' ? config.toValues(modal.item) : config.emptyValues}
        validate={config.validate}
        onClose={() => setModal(null)}
        onSubmit={submit}
      />
    </>
  );
}

const styles = themed(() => StyleSheet.create({
  toolbar: { paddingHorizontal: 16, gap: 10, paddingTop: 14, paddingBottom: 12 },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  count: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  newBtn: { height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, backgroundColor: colors.primary, maxWidth: 220 },
  newText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white, flexShrink: 1 },
  pad: { paddingHorizontal: 16, gap: 12 },
  skeleton: { height: 112, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, textAlign: 'center' },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
}));
