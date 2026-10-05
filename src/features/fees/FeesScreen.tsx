import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { AppBar } from '../dashboard/AppBar';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { AssignmentsTab } from './AssignmentsTab';
import { CollectionTab } from './CollectionTab';
import { StructuresTab } from './StructuresTab';

type TabKey = 'collection' | 'structures' | 'assignments';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'collection', label: 'Fees Collection', icon: 'card-outline' },
  { key: 'structures', label: 'Fee Structures', icon: 'layers-outline' },
  { key: 'assignments', label: 'Fee Assignments', icon: 'checkmark-circle-outline' },
];

export function FeesScreen() {
  const [tab, setTab] = useState<TabKey>('collection');

  const top = (
    <View style={styles.top}>
      <AppBar academicYear="2026-2027" hasUnread={false} />
      <Text style={styles.title}>Fees</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroll}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Ionicons name={t.icon} size={15} color={on ? colors.white : colors.text} />
              <Text style={[styles.chipText, on && { color: colors.white }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <ScreenBackground>
      {tab === 'collection' ? <CollectionTab top={top} /> : null}
      {tab === 'structures' ? <StructuresTab top={top} /> : null}
      {tab === 'assignments' ? <AssignmentsTab top={top} /> : null}
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  top: { gap: 14 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.text, marginTop: 4 },
  // negative margin lets the chip row bleed to the screen edges while the list keeps its 16px padding
  chipScroll: { marginHorizontal: -16, flexGrow: 0, flexShrink: 0 },
  chips: { gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
}));
