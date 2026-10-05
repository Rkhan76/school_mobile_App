import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { ApiError } from '../../lib/apiClient';
import { getEventsPdf } from './api';
import { dayKey, eventOnDay, formatDay, MONTH_NAMES, monthBounds, parseIso } from './dateUtils';
import { EventCard } from './EventCard';
import { EventDetailSheet } from './EventDetailSheet';
import { EventForm } from './EventForm';
import { FilterSheet } from './FilterSheet';
import { MonthCalendar } from './MonthCalendar';
import type { EventAudience, EventStatus, SchoolEvent } from './types';
import { useEvents } from './useEvents';

export function EventsScreen() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canCreate = permissions.includes('event.record.create');
  const canUpdate = permissions.includes('event.record.update');
  const canDelete = permissions.includes('event.record.delete');
  const canExportPdf = permissions.includes('event.pdf.read');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState<EventStatus | ''>('');
  const [targetAudience, setTargetAudience] = useState<EventAudience | ''>('');
  const [holidaysOnly, setHolidaysOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, refetch, add, update, remove } = useEvents(year, month, {
    search: debounced, status, targetAudience, holidaysOnly,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const list = useMemo(() => {
    if (selected) return data.filter((e) => eventOnDay(e, selected));
    const first = dayKey(new Date(year, month, 1));
    const last = dayKey(new Date(year, month + 1, 0));
    return data.filter(
      (e) => dayKey(parseIso(e.startDate)) <= last && dayKey(parseIso(e.endDate)) >= first,
    );
  }, [data, selected, year, month]);

  const detail = useMemo(() => data.find((e) => e.id === detailId) ?? null, [data, detailId]);

  const filterCount = (status ? 1 : 0) + (targetAudience ? 1 : 0);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const openCreate = useCallback(() => { setEditing(null); setFormOpen(true); }, []);
  const onEdit = useCallback((e: SchoolEvent) => { setDetailId(null); setEditing(e); setFormOpen(true); }, []);
  const onDelete = useCallback((e: SchoolEvent) => {
    Alert.alert('Delete event', `Delete "${e.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { setDetailId(null); remove(e.id); } },
    ]);
  }, [remove]);
  const onOpen = useCallback((e: SchoolEvent) => setDetailId(e.id), []);

  const onExportPdf = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { from, to } = monthBounds(year, month);
      const { blob, fileName } = await getEventsPdf({
        isHoliday: holidaysOnly ? true : undefined,
        from,
        to,
      });
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Could not read the downloaded PDF.'));
        reader.onload = () => {
          const result = String(reader.result ?? '');
          const comma = result.indexOf(',');
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.readAsDataURL(blob);
      });
      const file = new File(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(base64, { encoding: 'base64' });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', dialogTitle: fileName });
      } else {
        Alert.alert('Saved', `PDF saved to ${file.uri}`);
      }
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to export the PDF.');
    } finally {
      setExporting(false);
    }
  }, [exporting, year, month, holidaysOnly]);

  const onSelectDay = useCallback((key: string, date: Date) => {
    if (date.getMonth() !== month || date.getFullYear() !== year) {
      setYear(date.getFullYear());
      setMonth(date.getMonth());
    }
    setSelected((prev) => (prev === key ? null : key));
  }, [month, year]);

  const onToday = useCallback(() => {
    const d = new Date();
    setYear(d.getFullYear());
    setMonth(d.getMonth());
    setSelected(dayKey(d));
  }, []);

  const onMonthChange = useCallback((y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelected(null);
  }, []);

  const showSkeleton = isLoading && !refreshing;
  const listTitle = selected ? formatDay(parseIso(`${selected}T00:00`)) : `${MONTH_NAMES[month]} ${year}`;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.segment}>
        {([false, true] as const).map((h) => (
          <Pressable
            key={String(h)}
            style={[styles.segBtn, holidaysOnly === h && styles.segActive]}
            onPress={() => setHolidaysOnly(h)}
          >
            <Ionicons
              name={h ? 'sunny-outline' : 'calendar-outline'}
              size={16}
              color={holidaysOnly === h ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.segText, holidaysOnly === h && styles.segTextActive]}>
              {h ? 'All Holidays' : 'All Events'}
            </Text>
          </Pressable>
        ))}
      </View>
      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search events..."
        onFilterPress={() => setFilterOpen(true)}
        filterCount={filterCount}
      />
      <MonthCalendar
        year={year}
        month={month}
        events={data}
        selected={selected}
        onSelect={onSelectDay}
        onMonthChange={onMonthChange}
        onToday={onToday}
      />
      <View style={styles.listHead}>
        <Text style={styles.listTitle}>{listTitle}</Text>
        <Text style={styles.count}>{list.length} event{list.length === 1 ? '' : 's'}</Text>
      </View>
      {showSkeleton ? (
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Events"
        subtitle="School calendar"
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            {canExportPdf ? (
              <Pressable
                style={styles.iconBtn}
                onPress={onExportPdf}
                disabled={exporting}
                accessibilityLabel="Export PDF"
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                )}
              </Pressable>
            ) : null}
            {canCreate ? (
              <Pressable style={styles.newBtn} onPress={openCreate} accessibilityLabel="Create event">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>Create</Text>
              </Pressable>
            ) : null}
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : list}
        keyExtractor={(e) => e.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <EventCard
              item={item}
              onPress={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canUpdate}
              canDelete={canDelete}
            />
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{selected ? 'No events on this day' : 'No events this month'}</Text>
              <Text style={styles.emptySub}>Tap Create to add one.</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 96, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {canCreate ? (
        <Pressable
          style={[styles.fab, { bottom: insets.bottom + 20 }]}
          onPress={openCreate}
          accessibilityLabel="Add event"
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      ) : null}

      <FilterSheet
        visible={filterOpen}
        status={status}
        targetAudience={targetAudience}
        onChange={(n) => { setStatus(n.status); setTargetAudience(n.targetAudience); }}
        onClose={() => setFilterOpen(false)}
      />
      <EventDetailSheet
        event={detail}
        onClose={() => setDetailId(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canUpdate}
        canDelete={canDelete}
      />
      <EventForm
        visible={formOpen}
        event={editing}
        defaultDay={selected}
        onClose={() => setFormOpen(false)}
        onSubmit={async (input) => {
          const ok = editing ? await update(editing.id, input) : await add(input);
          if (ok) setFormOpen(false);
        }}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  segment: {
    flexDirection: 'row', padding: 4, borderRadius: radius.pill, backgroundColor: colors.mint, gap: 4,
  },
  segBtn: {
    flex: 1, height: 38, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  segActive: { backgroundColor: colors.primary },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  segTextActive: { color: colors.white },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  listTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  count: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 120, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  newBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  newText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryDarkest, shadowOpacity: 0.3,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
}));
