import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { ExamListTab } from './ExamListTab';
import { ExamResultsTab } from './ExamResultsTab';

type Tab = 'exam' | 'result';

const TABS: { key: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'exam', label: 'Exam', icon: 'clipboard-outline' },
  { key: 'result', label: 'Exam Result', icon: 'ribbon-outline' },
];

export function ExamsScreen() {
  const [tab, setTab] = useState<Tab>('exam');
  return (
    <ScreenBackground>
      <ScreenHeader title="Examinations" subtitle="Schedules and results" back />
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t.key)}>
              <Ionicons name={t.icon} size={16} color={active ? colors.white : colors.textSecondary} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {tab === 'exam' ? <ExamListTab /> : <ExamResultsTab />}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row', gap: 6, marginHorizontal: 16, marginBottom: 12, padding: 4,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  tab: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
});
