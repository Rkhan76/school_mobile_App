import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { DateBar, type DateCtl } from './DateBar';
import { confirmDiscard, useDebounced } from './guards';
import { buildHistory, STAFF_CATEGORIES, STAFF_STATUSES, type StaffCategory, type StaffMember } from './mockAttendance';
import { ActionButton, EmptyState, HistorySheet, ListSkeleton, STATUS_META, countStatuses } from './parts';
import { StaffCard } from './RosterCards';
import { SaveBar, useSaveFlow } from './SaveBar';
import { useStaffRoster } from './useRoster';

type Props = { ctl: DateCtl; onDirtyChange: (d: boolean) => void };
type Filter = 'All' | 'Teaching' | 'Non-teaching' | StaffCategory;

const FILTERS: Filter[] = ['All', 'Teaching', 'Non-teaching', ...STAFF_CATEGORIES.filter((c) => c !== 'Teaching')];

function matchesFilter(m: StaffMember, f: Filter): boolean {
  if (f === 'All') return true;
  if (f === 'Non-teaching') return m.category !== 'Teaching';
  return m.category === f;
}

export function StaffTab({ ctl, onDirtyChange }: Props) {
  const roster = useStaffRoster(ctl.loaded);
  const { data, isLoading, isRefreshing, dirty, isSaving, setStatus, setRemarks, markAll, refetch } = roster;
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim().toLowerCase(), 300);
  const [history, setHistory] = useState<StaffMember | null>(null);
  const onSave = useSaveFlow(roster, 'Staff');

  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const counts = useMemo(() => countStatuses(data), [data]);
  const visible = useMemo(
    () =>
      data.filter(
        (m) =>
          matchesFilter(m, filter) &&
          (!q || m.name.toLowerCase().includes(q) || m.empCode.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)),
      ),
    [data, filter, q],
  );

  const onRefresh = useCallback(() => confirmDiscard(dirty, refetch), [dirty, refetch]);
  const renderItem = useCallback(
    ({ item }: { item: StaffMember }) => (
      <StaffCard item={item} onStatus={setStatus} onRemarks={setRemarks} onHistory={setHistory} />
    ),
    [setStatus, setRemarks],
  );

  const header = (
    <View style={styles.header}>
      <View style={styles.tiles}>
        <Tile label="Total Staff" value={data.length} icon="people-outline" tint={colors.primary} />
        <Tile label="Present" value={counts.PRESENT} icon="checkmark-circle-outline" tint={STATUS_META.PRESENT.fg} />
        <Tile label="Absent" value={counts.ABSENT} icon="close-circle-outline" tint={STATUS_META.ABSENT.fg} />
        <Tile label="Late" value={counts.LATE} icon="time-outline" tint={STATUS_META.LATE.fg} />
        <Tile label="Excused" value={counts.EXCUSED} icon="calendar-outline" tint={STATUS_META.EXCUSED.fg} />
      </View>
      <Card>
        <DateBar
          ctl={ctl}
          actions={
            <>
              <ActionButton label="Refresh Roster" icon="refresh" onPress={onRefresh} />
              <ActionButton label="Mark All Present" icon="checkmark-done" onPress={() => markAll('PRESENT')} disabled={isLoading || data.length === 0} />
            </>
          }
        />
      </Card>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {FILTERS.map((f) => {
          const on = f === filter;
          return (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, on && styles.chipOn]} accessibilityState={{ selected: on }}>
              <Text style={[styles.chipText, on && { color: colors.white }]}>{f}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search staff..." />
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={isLoading ? [] : visible}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? (
            <ListSkeleton />
          ) : (
            <EmptyState icon="people-outline" title="No staff found" hint="Try a different category or search term." />
          )
        }
        ItemSeparatorComponent={Gap}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        initialNumToRender={8}
      />
      <HistorySheet
        visible={history !== null}
        title={history?.name ?? ''}
        subtitle={history ? `${history.empCode} · ${history.role}` : ''}
        entries={history ? buildHistory(history.id, ctl.loaded, false) : []}
        onClose={() => setHistory(null)}
      />
      <SaveBar order={STAFF_STATUSES} counts={counts} dirty={dirty} saving={isSaving} disabled={isLoading} onSave={onSave} />
    </View>
  );
}

function Gap() {
  return <View style={{ height: 10 }} />;
}

function Tile(props: Omit<React.ComponentProps<typeof StatTile>, 'value'> & { value: number }) {
  return (
    <View style={styles.tileWrap}>
      <StatTile {...props} value={String(props.value)} />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 190, paddingTop: 4 },
  header: { gap: 12, marginBottom: 12 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileWrap: { width: '48%', flexGrow: 1, flexDirection: 'row' },
  chips: { gap: 8 },
  chip: {
    height: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
}));
