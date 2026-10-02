import { useCallback, useEffect, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { ActionBtn, EmptyState, InfoRow, RoleTag, SkeletonList, infoText } from './parts';
import { formatDate, useReviewQueue, type ReviewItem } from './mockDocuments';

function RejectModal({ item, onClose, onConfirm }: {
  item: ReviewItem | null; onClose: () => void; onConfirm: (reason: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { if (item) { setReason(''); setError(''); } }, [item]);

  const submit = () => {
    if (reason.trim().length < 5) { setError('Please give a reason of at least 5 characters.'); return; }
    onConfirm(reason.trim());
  };

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grab} />
          <Text style={styles.sheetTitle}>Reject document</Text>
          <Text style={styles.sheetSub}>{item ? `${item.personName} - ${item.documentName}` : ''}</Text>
          <TextInput
            value={reason} onChangeText={setReason} placeholder="Reason for rejection (min 5 characters)"
            placeholderTextColor={colors.textHint} multiline
            style={[styles.input, !!error && { borderColor: colors.danger }]}
          />
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <View style={styles.sheetActions}>
            <Pressable style={[styles.sBtn, { backgroundColor: colors.mint }]} onPress={onClose}>
              <Text style={[styles.sText, { color: colors.primaryDeep }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.sBtn, { backgroundColor: colors.danger }]} onPress={submit}>
              <Text style={[styles.sText, { color: colors.white }]}>Reject</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ReviewTab() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, refetch, approve, reject } = useReviewQueue();
  const [refreshing, setRefreshing] = useState(false);
  const [rejecting, setRejecting] = useState<ReviewItem | null>(null);

  useEffect(() => { if (!isLoading) setRefreshing(false); }, [isLoading]);
  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const showSkeleton = isLoading && !refreshing;

  return (
    <>
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            {showSkeleton ? <SkeletonList count={3} height={210} /> : (
              <Text style={styles.count}>{data.length} document{data.length === 1 ? '' : 's'} pending review</Text>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <Card style={{ gap: 12 }}>
              <View style={styles.top}>
                <Avatar name={item.personName} size={40} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.personName}</Text>
                  <View style={{ flexDirection: 'row' }}><RoleTag role={item.role} /></View>
                </View>
                <Badge label="Pending" tone="warning" />
              </View>
              <View style={{ gap: 8 }}>
                <InfoRow label="Document"><Text style={infoText}>{item.documentName}</Text></InfoRow>
                <InfoRow label="File"><Text style={infoText} numberOfLines={1}>{item.fileName}</Text></InfoRow>
                <InfoRow label="Uploaded"><Text style={infoText}>{formatDate(item.uploadedAt)}</Text></InfoRow>
              </View>
              <View style={styles.actions}>
                <ActionBtn
                  label="Preview" icon="eye-outline"
                  onPress={() => Alert.alert('Preview', `Previewing ${item.fileName} is coming soon.`)}
                />
                <ActionBtn label="Approve" icon="checkmark" tone="primary" onPress={() => approve(item.id)} />
                <ActionBtn label="Reject" icon="close" tone="danger" onPress={() => setRejecting(item)} />
              </View>
            </Card>
          </View>
        )}
        ListEmptyComponent={
          showSkeleton ? null : <EmptyState icon="checkmark-done-outline" title="All caught up" sub="No documents are waiting for review." />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={doRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 12 }}
        showsVerticalScrollIndicator={false}
      />
      <RejectModal
        item={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => { if (rejecting) reject(rejecting.id, reason); setRejecting(null); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  count: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  itemWrap: { paddingHorizontal: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.4)' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 16, paddingTop: 10, gap: 8,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sheetSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  input: {
    height: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, textAlignVertical: 'top',
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sBtn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  sText: { fontFamily: fonts.bodySemi },
});
