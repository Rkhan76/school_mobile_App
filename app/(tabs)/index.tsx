import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { colors } from '../../src/theme/tokens';
import { useSession } from '../../src/features/auth/session';
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

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const userName = useSession((s) => s.user?.firstName ?? 'Admin');
  const { data, refreshing, refresh } = useDashboardData();

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
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard item={data.stats[0]} />
            <StatCard item={data.stats[1]} />
          </View>
          <View style={styles.gridRow}>
            <StatCard item={data.stats[2]} />
            <StatCard item={data.stats[3]} />
          </View>
        </View>
        <AttendanceCard data={data.attendance} />
        <CashflowCard data={data.cashflow} />
        <NoticeBoard notices={data.notices} activeCount={data.activeNotices} />
        <LeaveRequests leaves={data.leaves} pendingCount={data.pendingLeaveCount} />
        <Milestones items={data.milestones} />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 130, gap: 16 },
  grid: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 12 },
});
