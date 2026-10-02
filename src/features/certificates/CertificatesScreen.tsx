import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatTile } from '../../components/ui/StatTile';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { CertificateCard } from './CertificateCard';
import { CertificatePreview } from './CertificatePreview';
import { EMPTY_FILTERS, FilterSheet, type Filters } from './FilterSheet';
import { IssueModal } from './IssueModal';
import { RevokeModal } from './RevokeModal';
import type { Certificate } from './types';
import { useCertificates } from './useCertificates';

function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CertificatesScreen() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const canIssue = permissions.includes('certificate.record.create');
  const canRevoke = permissions.includes('certificate.revocation.update');

  const [search, setSearch] = useState('');
  const debounced = useDebounced(search, 300);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [viewing, setViewing] = useState<Certificate | null>(null);
  const [revoking, setRevoking] = useState<Certificate | null>(null);

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, stats, issue, revoke } = useCertificates({
    search: debounced,
    recipientType: filters.recipientType,
    status: filters.status,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  const doRefresh = useCallback(() => {
    setRefreshing(true);
    refetch();
  }, [refetch]);

  const onView = useCallback((c: Certificate) => setViewing(c), []);
  const onRevoke = useCallback((c: Certificate) => setRevoking(c), []);

  const filterCount = (filters.recipientType ? 1 : 0) + (filters.status ? 1 : 0);
  const showSkeleton = isLoading && !refreshing;

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.stats}>
        <StatTile label="Total" value={String(stats.total)} icon="ribbon-outline" />
        <StatTile label="Active" value={String(stats.active)} icon="checkmark-circle-outline" tint={colors.success} />
        <StatTile label="Revoked" value={String(stats.revoked)} icon="ban-outline" tint={colors.danger} />
      </View>
      <SearchBar
        value={search} onChangeText={setSearch} placeholder="Search by title or recipient..."
        onFilterPress={() => setFilterOpen(true)} filterCount={filterCount}
      />
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
        title="Certificates"
        subtitle="Issue and manage certificates"
        back
        right={
          <>
            <Pressable style={styles.iconBtn} onPress={doRefresh} accessibilityLabel="Refresh">
              <Ionicons name="refresh" size={20} color={colors.textSecondary} />
            </Pressable>
            {canIssue ? (
              <Pressable style={styles.newBtn} onPress={() => setIssueOpen(true)} accessibilityLabel="Issue certificate">
                <Ionicons name="add" size={18} color={colors.white} />
                <Text style={styles.newText}>Issue</Text>
              </Pressable>
            ) : null}
          </>
        }
      />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <CertificateCard item={item} canRevoke={canRevoke} onView={onView} onRevoke={onRevoke} />
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="ribbon-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No certificates found</Text>
              <Text style={styles.emptySub}>Try changing the search or filters.</Text>
            </View>
          )
        }
        ListFooterComponent={
          !showSkeleton && isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={6}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />

      <FilterSheet
        visible={filterOpen}
        value={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => { setFilters(f); setFilterOpen(false); }}
      />
      <CertificatePreview certificate={viewing} onClose={() => setViewing(null)} />
      <RevokeModal
        certificate={revoking}
        onClose={() => setRevoking(null)}
        onConfirm={async (id, reason) => {
          await revoke(id, reason);
          setRevoking(null);
        }}
      />
      {canIssue ? (
        <IssueModal
          visible={issueOpen}
          onClose={() => setIssueOpen(false)}
          onSubmit={async (input) => {
            const created = await issue(input);
            setIssueOpen(false);
            Alert.alert('Certificate issued', `${created.referenceNo} was issued to ${created.recipientName}.`);
          }}
        />
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 12, paddingBottom: 4 },
  stats: { flexDirection: 'row', gap: 10 },
  itemWrap: { paddingHorizontal: 16 },
  skeletons: { gap: 12 },
  skeleton: { height: 190, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footerLoader: { paddingVertical: 20 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  newBtn: {
    height: 40, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.pill, backgroundColor: colors.primary,
  },
  newText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
});
