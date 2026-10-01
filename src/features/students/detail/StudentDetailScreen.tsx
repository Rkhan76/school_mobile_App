import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../../components/ui/Screen';
import { Card } from '../../../components/ui/Card';
import { colors, fonts } from '../../../theme/tokens';
import { AppBar } from '../../dashboard/AppBar';
import { BottomActions } from './BottomActions';
import { OverviewTab } from './OverviewTab';
import { AttendanceTab, BankTab, DocumentsTab, FeesTab, GuardiansTab, HostelTab, ReportsTab } from './OtherTabs';
import { ProfileHeader, SubBar } from './ProfileHeader';
import { StatRow } from './StatRow';
import { useStudentDetail, type StudentDetail } from './studentDetail';
import { TabChips, type TabKey } from './TabChips';

function TabContent({ tab, s }: { tab: TabKey; s: StudentDetail }) {
  switch (tab) {
    case 'overview': return <OverviewTab s={s} />;
    case 'guardians': return <GuardiansTab s={s} />;
    case 'attendance': return <AttendanceTab s={s} />;
    case 'fees': return <FeesTab s={s} />;
    case 'bank': return <BankTab s={s} />;
    case 'hostel': return <HostelTab s={s} />;
    case 'documents': return <DocumentsTab s={s} />;
    case 'reports': return <ReportsTab s={s} />;
  }
}

function Skeleton() {
  const op = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  const block = (h: number) => <Card style={{ height: h, backgroundColor: colors.mint }} />;
  return (
    <Animated.View style={{ opacity: op, gap: 14 }}>
      {block(220)}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>{block(90)}</View>
        <View style={{ flex: 1 }}>{block(90)}</View>
        <View style={{ flex: 1 }}>{block(90)}</View>
      </View>
      {block(150)}
      {block(150)}
    </Animated.View>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <Card style={styles.nf}>
      <Ionicons name="person-remove-outline" size={40} color={colors.textHint} />
      <Text style={styles.nfTitle}>{message}</Text>
      <Text style={styles.nfSub}>This student record could not be loaded.</Text>
    </Card>
  );
}

export function StudentDetailScreen({ id }: { id: string | undefined }) {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useStudentDetail(id);
  const [tab, setTab] = useState<TabKey>('overview');

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <AppBar academicYear="26-27" hasUnread />
        <SubBar status={data?.status} />
        {isLoading && <Skeleton />}
        {!isLoading && (error || !data) && <NotFound message={error?.message ?? 'Student not found'} />}
        {data && (
          <>
            <ProfileHeader s={data} />
            <StatRow s={data} />
            <View style={styles.tabs}>
              <TabChips active={tab} onChange={setTab} />
            </View>
            <TabContent tab={tab} s={data} />
          </>
        )}
      </ScrollView>
      {data && <BottomActions s={data} />}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 14 },
  tabs: { marginHorizontal: -16 },
  nf: { alignItems: 'center', gap: 8, paddingVertical: 36 },
  nfTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  nfSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
});
