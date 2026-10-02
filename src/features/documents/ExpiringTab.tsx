import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { ActionBtn, Chip, EmptyState, InfoRow, RoleTag, SkeletonList, infoText } from './parts';
import { daysFromToday, formatDate, useExpiring, type ExpiringDoc } from './mockDocuments';

const WINDOWS = [30, 60, 90] as const;

function urgency(days: number): { label: string; tone: 'danger' | 'warning' | 'success' | 'primary' } {
  if (days < 0) return { label: `Expired ${-days}d ago`, tone: 'danger' };
  if (days === 0) return { label: 'Expires today', tone: 'danger' };
  if (days <= 14) return { label: `${days}d left`, tone: 'danger' };
  if (days <= 30) return { label: `${days}d left`, tone: 'warning' };
  return { label: `${days}d left`, tone: 'success' };
}

export function ExpiringTab() {
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState<number>(30);
  const [refreshing, setRefreshing] = useState(false);
  const { data, isLoading, refetch, requestRenewal } = useExpiring(days);

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);
  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const onRenew = useCallback((d: ExpiringDoc) => {
    requestRenewal(d.id);
    Alert.alert('Renewal requested', `A renewal request for ${d.documentName} was sent to ${d.personName}.`);
  }, [requestRenewal]);

  const showSkeleton = isLoading && !refreshing;

  return (
    <FlatList
      data={showSkeleton ? [] : data}
      keyExtractor={(d) => d.id}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <View style={styles.seg}>
            {WINDOWS.map((w) => (
              <Chip key={w} label={`${w} days`} on={days === w} onPress={() => setDays(w)} />
            ))}
          </View>
          {showSkeleton ? <SkeletonList count={3} height={190} /> : (
            <Text style={styles.count}>{data.length} document{data.length === 1 ? '' : 's'} expiring within {days} days</Text>
          )}
        </View>
      }
      renderItem={({ item }) => {
        const left = daysFromToday(item.expiresAt);
        const u = urgency(left);
        return (
          <View style={styles.itemWrap}>
            <Card style={{ gap: 12 }}>
              <View style={styles.top}>
                <Avatar name={item.personName} size={40} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.personName}</Text>
                  <View style={{ flexDirection: 'row' }}><RoleTag role={item.role} /></View>
                </View>
                <Badge label={u.label} tone={u.tone} />
              </View>
              <View style={{ gap: 8 }}>
                <InfoRow label="Document"><Text style={infoText}>{item.documentName}</Text></InfoRow>
                <InfoRow label="Expires">
                  <Text style={[infoText, left < 0 && { color: colors.danger }]}>{formatDate(item.expiresAt)}</Text>
                </InfoRow>
              </View>
              <View style={styles.actions}>
                {item.renewalRequested ? (
                  <Badge label="Renewal requested" tone="primary" />
                ) : (
                  <ActionBtn label="Request renewal" icon="refresh-outline" tone="primary" onPress={() => onRenew(item)} />
                )}
              </View>
            </Card>
          </View>
        );
      }}
      ListEmptyComponent={
        showSkeleton ? null : <EmptyState icon="calendar-outline" title="Nothing expiring" sub={`No documents expire within ${days} days.`} />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
      }
      contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  seg: { flexDirection: 'row', gap: 8 },
  count: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  itemWrap: { paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end' },
});
