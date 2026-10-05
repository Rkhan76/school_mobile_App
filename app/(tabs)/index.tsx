import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { colors, themed } from '../../src/theme/tokens';
import { useSession } from '../../src/features/auth/session';
import { useAccess, type Access } from '../../src/features/auth/access';
import { AppBar } from '../../src/features/dashboard/AppBar';
import { AttendanceCard } from '../../src/features/dashboard/AttendanceCard';
import { CashflowCard } from '../../src/features/dashboard/CashflowCard';
import { HeroCard } from '../../src/features/dashboard/HeroCard';
import { LeaveRequests } from '../../src/features/dashboard/LeaveRequests';
import { Milestones } from '../../src/features/dashboard/Milestones';
import { useDashboardData } from '../../src/features/dashboard/mockData';
import { NoticeBoard } from '../../src/features/dashboard/NoticeBoard';
import { QuickActions } from '../../src/features/dashboard/QuickActions';
import { StatCard } from '../../src/features/dashboard/StatCard';

// Admin-oriented blocks (mock data for now). Permissions come from the login response; hideForRoles is a hardcoded default.
const STAT_ACCESS: Record<string, Access> = {
  students: { anyOf: ['student.list.read'] },
  teachers: { anyOf: ['teacher.list.read'] },
  fees: { hideForRoles: ['TEACHER'] },
  attendance: { anyOf: ['attendance.list.read'] },
};
const CASHFLOW_ACCESS: Access = { hideForRoles: ['TEACHER'] };
const ATTENDANCE_ACCESS: Access = { anyOf: ['attendance.list.read'] };
const NOTICES_ACCESS: Access = { anyOf: ['notice.list.read'] };
const LEAVES_ACCESS: Access = { anyOf: ['leave-application.decision.update'] };

export default function DashboardScreen() {
  const can = useAccess();
  const insets = useSafeAreaInsets();
  const userName = useSession((s) => s.user?.firstName ?? 'Admin');
  const { data, refreshing, refresh } = useDashboardData();
  const visibleStats = data.stats.filter((s) => can(STAT_ACCESS[s.id]));
  const statRows = Array.from({ length: Math.ceil(visibleStats.length / 2) }, (_, i) => visibleStats.slice(i * 2, i * 2 + 2));

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressViewOffset={insets.top}
          />
        }
      >
        <AppBar academicYear={data.academicYear} hasUnread={data.hasUnread} />
        <HeroCard hero={data.hero} userName={userName} />
        <QuickActions />
        {statRows.length > 0 && (
          <View style={styles.grid}>
            {statRows.map((row) => (
              <View key={row.map((s) => s.id).join('-')} style={styles.gridRow}>
                {row.map((s) => (
                  <StatCard key={s.id} item={s} />
                ))}
              </View>
            ))}
          </View>
        )}
        {can(ATTENDANCE_ACCESS) && <AttendanceCard data={data.attendance} />}
        {can(CASHFLOW_ACCESS) && <CashflowCard data={data.cashflow} />}
        {can(NOTICES_ACCESS) && <NoticeBoard notices={data.notices} activeCount={data.activeNotices} />}
        {can(LEAVES_ACCESS) && <LeaveRequests leaves={data.leaves} pendingCount={data.pendingLeaveCount} />}
        <Milestones items={data.milestones} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 130, gap: 16 },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
}));
