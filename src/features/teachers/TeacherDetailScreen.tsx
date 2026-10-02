import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { StatTile } from '../../components/ui/StatTile';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { useSession } from '../auth/session';
import { AppBar } from '../dashboard/AppBar';
import { EditTeacherModal } from './EditTeacherModal';
import { OverviewTab } from './OverviewTab';
import { AttendanceTab, DocumentsTab, PayrollTab, ReportsTab, SubjectsTab, TimetableTab } from './OtherTabs';
import { TeacherBottomActions } from './TeacherBottomActions';
import { TeacherProfileCard } from './TeacherProfileCard';
import { TeacherSubBar } from './TeacherSubBar';
import { TeacherTabs, type TeacherTab } from './TeacherTabs';
import {
  useTeacherDetail,
  type EmploymentHistoryRow,
  type TeacherDetail,
} from './teacherDetail';

function TabContent({
  tab,
  t,
  employmentHistory,
  employmentHistoryLoading,
  onLoadEmploymentHistory,
}: {
  tab: TeacherTab;
  t: TeacherDetail;
  employmentHistory: EmploymentHistoryRow[] | null;
  employmentHistoryLoading: boolean;
  onLoadEmploymentHistory: () => void;
}) {
  switch (tab) {
    case 'Overview':
      return (
        <OverviewTab
          t={t}
          employmentHistory={employmentHistory}
          employmentHistoryLoading={employmentHistoryLoading}
          onLoadEmploymentHistory={onLoadEmploymentHistory}
        />
      );
    case 'Subjects & Classes': return <SubjectsTab t={t} />;
    case 'Timetable': return <TimetableTab t={t} />;
    case 'Attendance': return <AttendanceTab t={t} />;
    case 'Payroll': return <PayrollTab t={t} />;
    case 'Documents': return <DocumentsTab t={t} />;
    case 'Reports': return <ReportsTab t={t} />;
  }
}

function Skeleton() {
  return (
    <View style={styles.gap}>
      <View style={[styles.sk, { height: 200, borderRadius: radius.xl }]} />
      <View style={styles.statsRow}>
        {[0, 1, 2].map((i) => <View key={i} style={[styles.sk, { flex: 1, height: 84 }]} />)}
      </View>
      <View style={[styles.sk, { height: 38, borderRadius: radius.pill }]} />
      <View style={[styles.sk, { height: 220, borderRadius: radius.xl }]} />
      <View style={[styles.sk, { height: 160, borderRadius: radius.xl }]} />
    </View>
  );
}

function NotFound({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <Card style={styles.notFound}>
      <Ionicons name="person-remove-outline" size={36} color={colors.textHint} />
      <Text style={styles.nfTitle}>Teacher not found</Text>
      <Text style={styles.nfText}>{message}</Text>
      <Pressable style={styles.nfBtn} onPress={onBack}>
        <Text style={styles.nfBtnText}>Back to directory</Text>
      </Pressable>
    </Card>
  );
}

export function TeacherDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const permissions = useSession((s) => s.permissions);
  const {
    data,
    isLoading,
    error,
    mutating,
    employmentHistory,
    employmentHistoryLoading,
    loadEmploymentHistory,
    updateProfile,
    setStatus,
    toggleBlock,
  } = useTeacherDetail(id);
  const [tab, setTab] = useState<TeacherTab>('Overview');
  const [editOpen, setEditOpen] = useState(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const can = useCallback((perm: string) => permissions.includes(perm), [permissions]);

  const docsVerified = data ? `${data.documents.filter((d) => d.verified).length}/${data.documents.length}` : '';

  const confirmToggleStatus = useCallback(() => {
    if (!data) return;
    const next = data.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const title = next === 'INACTIVE' ? 'Deactivate teacher' : 'Reactivate teacher';
    const message =
      next === 'INACTIVE'
        ? 'This immediately kills their portal login and revokes all active sessions. Reactivating later does NOT automatically restore the login — someone will need to re-invite them separately. Continue?'
        : 'This sets the teacher back to ACTIVE, but it does NOT automatically restore their portal login — they will need to be re-invited separately to log in again. Continue?';
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: next === 'INACTIVE' ? 'Deactivate' : 'Reactivate',
        style: next === 'INACTIVE' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await setStatus(next);
          } catch (err) {
            Alert.alert('Could not update status', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  }, [data, setStatus]);

  const confirmToggleBlock = useCallback(() => {
    if (!data) return;
    const blocking = !data.blocked;
    const title = blocking ? 'Block teacher' : 'Unblock teacher';
    const message = blocking
      ? 'This soft-deletes the teacher/staff record, sets their portal login to INACTIVE, and revokes all sessions. Unlike a plain status change, unblocking later DOES automatically restore the login. Continue?'
      : 'This restores the teacher/staff record and automatically re-activates their portal login (subject to available staff seats). Continue?';
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: blocking ? 'Block' : 'Unblock',
        style: blocking ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await toggleBlock();
          } catch (err) {
            Alert.alert('Could not update', err instanceof Error ? err.message : 'Something went wrong.');
          }
        },
      },
    ]);
  }, [data, toggleBlock]);

  const openMoreActions = useCallback(() => {
    if (!data) return;
    Alert.alert('More actions', undefined, [
      { text: data.blocked ? 'Unblock teacher' : 'Block teacher', style: data.blocked ? 'default' : 'destructive', onPress: confirmToggleBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [data, confirmToggleBlock]);

  const submitEdit = useCallback(
    async (partial: Parameters<typeof updateProfile>[0]) => {
      try {
        await updateProfile(partial);
        setEditOpen(false);
      } catch (err) {
        Alert.alert('Could not save changes', err instanceof Error ? err.message : 'Something went wrong.');
      }
    },
    [updateProfile]
  );

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 110 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pad}>
          <AppBar academicYear="26-27" hasUnread />
        </View>
        <View style={styles.pad}>
          <TeacherSubBar
            active={data ? data.status === 'ACTIVE' : true}
            busy={mutating}
            canToggleStatus={!!data && can('teacher.status.update')}
            onToggleStatus={confirmToggleStatus}
            canEdit={!!data && can('teacher.profile.update')}
            onEdit={() => setEditOpen(true)}
            canBlock={!!data && can('teacher.profile.delete')}
            onMore={openMoreActions}
          />
        </View>

        {isLoading ? (
          <View style={styles.pad}><Skeleton /></View>
        ) : error || !data ? (
          <View style={styles.pad}>
            <NotFound message={error?.message ?? 'No teacher record for this id.'} onBack={goBack} />
          </View>
        ) : (
          <>
            <View style={styles.pad}><TeacherProfileCard t={data} /></View>
            <View style={[styles.pad, styles.statsRow]}>
              <StatTile label="Experience" value={data.experience} icon="briefcase-outline" />
              <StatTile label="Classes" value={String(data.assignments.length)} icon="easel-outline" tint={colors.blue} />
              <StatTile label="Docs verified" value={docsVerified} icon="checkmark-done-outline" tint={colors.success} />
            </View>
            <TeacherTabs active={tab} onChange={setTab} />
            <View style={[styles.pad, styles.gap]}>
              <TabContent
                tab={tab}
                t={data}
                employmentHistory={employmentHistory}
                employmentHistoryLoading={employmentHistoryLoading}
                onLoadEmploymentHistory={loadEmploymentHistory}
              />
            </View>
          </>
        )}
      </ScrollView>
      {data ? <TeacherBottomActions phone={data.phone} /> : null}
      {data ? (
        <EditTeacherModal
          visible={editOpen}
          teacher={data}
          busy={mutating}
          onSubmit={submitEdit}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  pad: { paddingHorizontal: 16 },
  gap: { gap: 14 },
  statsRow: { flexDirection: 'row', gap: 10 },
  sk: { backgroundColor: colors.mint, borderRadius: radius.lg, opacity: 0.7 },
  notFound: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  nfTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  nfText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  nfBtn: { marginTop: 8, backgroundColor: colors.primaryDeep, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 10 },
  nfBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
});
