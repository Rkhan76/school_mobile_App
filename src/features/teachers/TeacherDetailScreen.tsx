import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { StatTile } from '../../components/ui/StatTile';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { AppBar } from '../dashboard/AppBar';
import { OverviewTab } from './OverviewTab';
import { AttendanceTab, DocumentsTab, PayrollTab, ReportsTab, SubjectsTab, TimetableTab } from './OtherTabs';
import { TeacherBottomActions } from './TeacherBottomActions';
import { TeacherProfileCard } from './TeacherProfileCard';
import { TeacherSubBar } from './TeacherSubBar';
import { TeacherTabs, type TeacherTab } from './TeacherTabs';
import { useTeacherDetail, type TeacherDetail } from './teacherDetail';

function TabContent({ tab, t }: { tab: TeacherTab; t: TeacherDetail }) {
  switch (tab) {
    case 'Overview': return <OverviewTab t={t} />;
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
  const { data, isLoading, error } = useTeacherDetail(id);
  const [tab, setTab] = useState<TeacherTab>('Overview');

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));
  const attendedPct = data ? `${data.attendance.percentage}%` : '';

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
          <TeacherSubBar active={data ? data.status === 'ACTIVE' : true} />
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
              <StatTile label="Experience" value={`${data.experienceYears} yrs`} icon="briefcase-outline" />
              <StatTile label="Classes" value={String(data.assignments.length)} icon="easel-outline" tint={colors.blue} />
              <StatTile label="Attd. (month)" value={attendedPct} icon="checkmark-done-outline" tint={colors.success} />
            </View>
            <TeacherTabs active={tab} onChange={setTab} />
            <View style={[styles.pad, styles.gap]}>
              <TabContent tab={tab} t={data} />
            </View>
          </>
        )}
      </ScrollView>
      {data ? <TeacherBottomActions phone={data.phone} /> : null}
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
