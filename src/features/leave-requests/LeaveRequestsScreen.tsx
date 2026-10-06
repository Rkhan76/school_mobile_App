import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Badge } from '../../components/ui/Badge';
import { DateInput } from '../../components/ui/DateInput';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { formatDate, LeaveRequestCard } from './LeaveRequestCard';
import { useLeaveRequests } from './useLeaveRequests';
import { APPLICANT_ROLES, LEAVE_STATUSES, type ApplicantRoleFilter, type LeaveApplication, type LeaveStatus } from './types';
import { hScrollFixed } from '../../components/ui/scrollStyles';

const STATUS_LABEL: Record<LeaveStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

const ROLE_LABEL: Record<ApplicantRoleFilter, string> = {
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  STAFF: 'Staff',
};

const DATE_HINT = 'dd/mm/yyyy';

/** `DD/MM/YYYY` → `YYYY-MM-DD`, or null if the text doesn't parse as a real calendar date. */
function parseDateInput(text: string): string | null {
  const m = text.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${yyyy}-${mm}-${dd}`;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function RejectModal({
  item, onClose, onConfirm,
}: { item: LeaveApplication | null; onClose: () => void; onConfirm: (comments?: string) => void }) {
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState('');

  useEffect(() => { if (item) setComments(''); }, [item]);

  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grab} />
          <Text style={styles.sheetTitle}>Reject leave request</Text>
          <Text style={styles.sheetSub}>{item ? `${item.applicantName} — ${formatDate(item.startDate)} to ${formatDate(item.endDate)}` : ''}</Text>
          <Text style={styles.label}>Comments (optional)</Text>
          <TextInput
            value={comments}
            onChangeText={setComments}
            placeholder="Add a reason for the applicant..."
            placeholderTextColor={colors.textHint}
            multiline
            style={styles.input}
          />
          <View style={styles.sheetActions}>
            <Pressable style={[styles.sBtn, { backgroundColor: colors.mint }]} onPress={onClose}>
              <Text style={[styles.sText, { color: colors.primaryDeep }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.sBtn, { backgroundColor: colors.danger }]}
              onPress={() => onConfirm(comments.trim() || undefined)}
            >
              <Text style={[styles.sText, { color: colors.white }]}>Reject</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DetailSheet({ item, onClose }: { item: LeaveApplication | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!item} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grab} />
        {item ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailTop}>
              <Text style={styles.sheetTitle}>{item.applicantName}</Text>
              <Badge
                label={STATUS_LABEL[item.status]}
                tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : item.status === 'PENDING' ? 'warning' : 'neutral'}
              />
            </View>
            <Text style={styles.sheetSub}>{item.applicantRole}</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Leave type</Text>
              <Text style={styles.detailValue}>{item.leaveTypeName ?? 'Leave'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dates</Text>
              <Text style={styles.detailValue}>{formatDate(item.startDate)} – {formatDate(item.endDate)}{item.totalDays ? ` (${item.totalDays} day${item.totalDays > 1 ? 's' : ''})` : ''}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Applied on</Text>
              <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
            </View>
            {item.reason ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>Reason</Text>
                <Text style={styles.detailBlockValue}>{item.reason}</Text>
              </View>
            ) : null}
            {item.status !== 'PENDING' && item.reviewedAt ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailLabel}>
                  {item.status === 'APPROVED' ? 'Approved' : 'Reviewed'}{item.approvedBy?.name ? ` by ${item.approvedBy.name}` : ''} on {formatDate(item.reviewedAt)}
                </Text>
                {item.reviewComments ? <Text style={styles.detailBlockValue}>{item.reviewComments}</Text> : null}
              </View>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

export function LeaveRequestsScreen() {
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const currentUserId = useSession((s) => s.user?.id);
  const canDecidePermission = permissions.includes('leave-application.decision.update');

  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'ALL'>('ALL');
  const [roleFilter, setRoleFilter] = useState<ApplicantRoleFilter | 'ALL'>('ALL');
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [dateError, setDateError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [rejecting, setRejecting] = useState<LeaveApplication | null>(null);
  const [viewing, setViewing] = useState<LeaveApplication | null>(null);

  const fromIso = fromText.trim() ? parseDateInput(fromText) : null;
  const toIso = toText.trim() ? parseDateInput(toText) : null;
  const fromValid = !fromText.trim() || fromIso !== null;
  const toValid = !toText.trim() || toIso !== null;

  const { data, isLoading, isLoadingMore, hasMore, loadMore, refetch, decide } = useLeaveRequests({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    applicantRole: roleFilter === 'ALL' ? undefined : roleFilter,
    from: fromValid && fromIso ? fromIso : undefined,
    to: toValid && toIso ? toIso : undefined,
  });

  useEffect(() => {
    if (!isLoading) setRefreshing(false);
  }, [isLoading]);

  useEffect(() => {
    if (!fromValid || !toValid) setDateError(`Use format ${DATE_HINT}.`);
    else setDateError('');
  }, [fromValid, toValid]);

  const doRefresh = useCallback(() => { setRefreshing(true); refetch(); }, [refetch]);

  const canDecide = useCallback(
    (item: LeaveApplication) => canDecidePermission && item.applicantId !== currentUserId,
    [canDecidePermission, currentUserId]
  );

  const onApprove = useCallback(
    (item: LeaveApplication) => {
      Alert.alert(
        'Approve leave request',
        "Approving this will mark the applicant's attendance as EXCUSED for every day in this leave's date range, overwriting any existing attendance for those days. Continue?",
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Approve', onPress: () => { void decide(item.id, 'APPROVED'); } },
        ]
      );
    },
    [decide]
  );

  const onReject = useCallback((item: LeaveApplication) => setRejecting(item), []);
  const onConfirmReject = useCallback(
    (comments?: string) => {
      if (rejecting) void decide(rejecting.id, 'REJECTED', comments);
      setRejecting(null);
    },
    [rejecting, decide]
  );

  const showSkeleton = isLoading && !refreshing;

  const header = useMemo(
    () => (
      <View style={styles.headerWrap}>
        <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="All" active={statusFilter === 'ALL'} onPress={() => setStatusFilter('ALL')} />
          {LEAVE_STATUSES.map((s) => (
            <Chip key={s} label={STATUS_LABEL[s]} active={statusFilter === s} onPress={() => setStatusFilter(s)} />
          ))}
        </ScrollView>

        <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label="All roles" active={roleFilter === 'ALL'} onPress={() => setRoleFilter('ALL')} />
          {APPLICANT_ROLES.map((r) => (
            <Chip key={r} label={ROLE_LABEL[r]} active={roleFilter === r} onPress={() => setRoleFilter(r)} />
          ))}
        </ScrollView>

        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>From</Text>
            <DateInput
              value={fromText} onChangeText={setFromText} placeholder={DATE_HINT} autoCorrect={false}
              style={[styles.dateInput, !fromValid && styles.dateInputErr]}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>To</Text>
            <DateInput
              value={toText} onChangeText={setToText} placeholder={DATE_HINT} autoCorrect={false}
              style={[styles.dateInput, !toValid && styles.dateInputErr]}
            />
          </View>
          {(fromText.length > 0 || toText.length > 0) && (
            <Pressable
              style={styles.clearDates}
              onPress={() => { setFromText(''); setToText(''); }}
              accessibilityLabel="Clear dates"
            >
              <Ionicons name="close-circle" size={20} color={colors.textHint} />
            </Pressable>
          )}
        </View>
        {dateError ? <Text style={styles.dateErrText}>{dateError}</Text> : null}
      </View>
    ),
    [statusFilter, roleFilter, fromText, toText, fromValid, toValid, dateError]
  );

  return (
    <ScreenBackground>
      <ScreenHeader title="Leave Requests" subtitle="Review and decide applications" back />
      <FlatList
        data={showSkeleton ? [] : data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <LeaveRequestCard
              item={item}
              canDecide={canDecide(item)}
              onPress={setViewing}
              onApprove={onApprove}
              onReject={onReject}
            />
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          showSkeleton ? null : (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>No leave requests found</Text>
              <Text style={styles.emptySub}>Try changing the filters above.</Text>
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

      <RejectModal item={rejecting} onClose={() => setRejecting(null)} onConfirm={onConfirmReject} />
      <DetailSheet item={viewing} onClose={() => setViewing(null)} />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  dateField: { flex: 1, gap: 4 },
  dateLabel: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.textSecondary },
  dateInput: {
    height: 42, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    fontFamily: fonts.body, fontSize: 13, color: colors.text, backgroundColor: colors.cardSolid,
  },
  dateInputErr: { borderColor: colors.danger },
  dateErrText: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  clearDates: { paddingBottom: 10 },
  itemWrap: { paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footerLoader: { paddingVertical: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.4)' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 16, paddingTop: 10, gap: 8, maxHeight: '80%',
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 6 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sheetSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  input: {
    height: 100, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, textAlignVertical: 'top',
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 4 },
  sBtn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  sText: { fontFamily: fonts.bodySemi },
  detailTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  detailBlock: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: 4 },
  detailLabel: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  detailValue: { fontFamily: fonts.body, fontSize: 13, color: colors.text, flexShrink: 1, textAlign: 'right' },
  detailBlockValue: { fontFamily: fonts.body, fontSize: 13, color: colors.text, lineHeight: 19 },
}));
