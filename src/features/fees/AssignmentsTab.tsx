import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { BottomSheet, Button, EmptyState, OptionSheet, SkeletonCard } from './parts';
import { CLASSES, formatINR, useAssignments, type AssignmentRow } from './mockFees';

const PAGE_SIZE = 10;
const TAB_BAR_SPACE = 120;

type BulkStep = 'class' | 'structure' | null;

export function AssignmentsTab({ top }: { top: ReactElement }) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('');
  const [classFilterOpen, setClassFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [target, setTarget] = useState<AssignmentRow | null>(null);
  const [bulk, setBulk] = useState<BulkStep>(null);
  const [bulkClass, setBulkClass] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchText); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchText]);

  const { data, total, structures, assignedCount, totalStudents, isLoading, refetch, assign, assignClass } =
    useAssignments({ search, classId, page, pageSize: PAGE_SIZE });

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);

  const onRefresh = useCallback(() => { setRefreshing(true); setPage(1); refetch(); }, [refetch]);
  const hasMore = data.length < total;
  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    setPage((p) => p + 1);
  }, [isLoading, hasMore]);

  const classOptions = useMemo(() => CLASSES.map((c) => ({ value: c.id, label: c.name })), []);
  const structureOptions = useMemo(
    () => structures.map((s) => ({
      value: s.id, label: s.className,
      sub: formatINR(s.heads.reduce((a, h) => a + h.amount, 0)),
    })),
    [structures],
  );

  const confirmBulk = (structureId: string) => {
    const cls = CLASSES.find((c) => c.id === bulkClass);
    const st = structures.find((s) => s.id === structureId);
    setBulk(null);
    if (!cls || !st) return;
    setTimeout(() => {
      Alert.alert('Assign to class', `Assign the ${st.className} fee structure to all students of ${cls.name}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Assign',
          onPress: () => {
            const n = assignClass(cls.id, st.id);
            Alert.alert('Done', `${n} student${n === 1 ? '' : 's'} assigned.`);
          },
        },
      ]);
    }, 350);
  };

  const showSkeleton = isLoading && !refreshing;
  const className = CLASSES.find((c) => c.id === classId)?.name;

  const header = (
    <View style={styles.header}>
      {top}
      <View style={styles.row}>
        <StatTile label="Assigned" value={String(assignedCount)} icon="checkmark-circle-outline" tint={colors.success} />
        <StatTile label="Unassigned" value={String(totalStudents - assignedCount)} icon="remove-circle-outline" tint={colors.orange} />
      </View>
      <Button label="Assign to class" icon="people-outline" onPress={() => setBulk('class')} />
      <SearchBar
        value={searchText} onChangeText={setSearchText} placeholder="Search student..."
        onFilterPress={() => setClassFilterOpen(true)} filterCount={classId ? 1 : 0}
      />
      {className ? <Text style={styles.filterNote}>Class filter: {className}</Text> : null}
    </View>
  );

  return (
    <>
      <FlatList<AssignmentRow>
        data={showSkeleton ? [] : data}
        keyExtractor={(a) => a.studentId}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Avatar name={item.studentName} size={42} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.name} numberOfLines={1}>{item.studentName}</Text>
              <Text style={styles.sub}>{item.className} · Roll {item.rollNo}</Text>
              {item.structureName ? (
                <Text style={styles.struct}>{item.structureName} · {formatINR(item.structureTotal ?? 0)}</Text>
              ) : (
                <Badge label="Unassigned" tone="warning" />
              )}
            </View>
            <Pressable style={styles.editBtn} onPress={() => setTarget(item)} accessibilityLabel={`Change structure for ${item.studentName}`}>
              <Ionicons name="swap-horizontal-outline" size={18} color={colors.primaryDeep} />
            </Pressable>
          </Card>
        )}
        ListHeaderComponent={header}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          showSkeleton ? (
            <View style={{ gap: 12 }}>{[0, 1, 2, 3].map((k) => <SkeletonCard key={k} height={86} />)}</View>
          ) : (
            <EmptyState icon="people-outline" title="No students found" sub="Try changing the search or class filter." />
          )
        }
        ListFooterComponent={
          showSkeleton ? null : isLoading && page > 1 ? (
            <ActivityIndicator style={{ marginVertical: 16 }} color={colors.primary} />
          ) : !hasMore && data.length > 0 ? (
            <Text style={styles.endText}>You've reached the end</Text>
          ) : null
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <OptionSheet
        visible={classFilterOpen} title="Filter by class" allLabel="All Classes" options={classOptions} value={classId}
        onClose={() => setClassFilterOpen(false)}
        onSelect={(v) => { setClassId(v); setPage(1); setClassFilterOpen(false); }}
      />

      <BottomSheet visible={target !== null} title={target ? `Fee structure for ${target.studentName}` : ''} onClose={() => setTarget(null)}>
        {target ? (
          <>
            <Text style={styles.sub}>{target.className} · currently {target.structureName ?? 'unassigned'}</Text>
            {structureOptions.map((o) => {
              const on = target.structureId === o.value;
              return (
                <Pressable
                  key={o.value} style={[styles.opt, on && styles.optOn]}
                  onPress={() => { assign(target.studentId, o.value); setTarget(null); }}
                >
                  <Text style={[styles.optText, on && { color: colors.primaryDeep, fontFamily: fonts.bodySemi }]}>{o.label}</Text>
                  <Text style={styles.optSub}>{o.sub}</Text>
                  {on ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
            {target.structureId ? (
              <Button label="Unassign" variant="danger" onPress={() => { assign(target.studentId, null); setTarget(null); }} />
            ) : null}
          </>
        ) : null}
      </BottomSheet>

      <OptionSheet
        visible={bulk === 'class'} title="Assign to class: select class" options={classOptions} value={bulkClass}
        onClose={() => setBulk(null)}
        onSelect={(v) => { setBulkClass(v); setBulk(null); setTimeout(() => setBulk('structure'), 350); }}
      />
      <OptionSheet
        visible={bulk === 'structure'} title="Select fee structure" options={structureOptions} value=""
        onClose={() => setBulk(null)} onSelect={confirmBulk}
      />
    </>
  );
}

function Separator() {
  return <View style={{ height: 12 }} />;
}

const styles = StyleSheet.create({
  header: { gap: 12, marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  filterNote: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  endText: { textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.textHint, marginVertical: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  struct: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  editBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 12, borderRadius: radius.md },
  optOn: { backgroundColor: colors.mintSoft },
  optText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  optSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
