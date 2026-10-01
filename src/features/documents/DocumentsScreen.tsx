import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { ExpiringTab } from './ExpiringTab';
import { RequestsTab } from './RequestsTab';
import { ReviewTab } from './ReviewTab';
import { TypesTab } from './TypesTab';

type TabKey = 'review' | 'requests' | 'expiring' | 'types';

const TABS: { key: TabKey; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'review', label: 'Review Queue', icon: 'clipboard-outline' },
  { key: 'requests', label: 'Requests', icon: 'paper-plane-outline' },
  { key: 'expiring', label: 'Expiring', icon: 'hourglass-outline' },
  { key: 'types', label: 'Document Types', icon: 'document-text-outline' },
];

export function DocumentsScreen() {
  const [tab, setTab] = useState<TabKey>('requests');
  return (
    <ScreenBackground>
      <ScreenHeader title="Documents" subtitle="Requests, reviews and expiries" back />
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <Pressable
                key={t.key} onPress={() => setTab(t.key)} style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="tab" accessibilityState={{ selected: on }}
              >
                <Ionicons name={t.icon} size={15} color={on ? colors.white : colors.text} />
                <Text style={[styles.chipText, on && { color: colors.white }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={{ flex: 1 }}>
        {tab === 'review' ? <ReviewTab /> : null}
        {tab === 'requests' ? <RequestsTab /> : null}
        {tab === 'expiring' ? <ExpiringTab /> : null}
        {tab === 'types' ? <TypesTab /> : null}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingBottom: 12 },
  tabs: { gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
});
