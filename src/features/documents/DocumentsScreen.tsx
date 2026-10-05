import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { isFeatureNotInPlanError, listDocumentTypes } from './api';
import { ExpiringTab } from './ExpiringTab';
import { RequestsTab } from './RequestsTab';
import { ReviewTab } from './ReviewTab';
import { TypesTab } from './TypesTab';
import { hScrollFixed } from '../../components/ui/scrollStyles';

type TabKey = 'review' | 'requests' | 'expiring' | 'types';

const TABS: { key: TabKey; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'review', label: 'Review Queue', icon: 'clipboard-outline' },
  { key: 'requests', label: 'Requests', icon: 'paper-plane-outline' },
  { key: 'expiring', label: 'Expiring', icon: 'hourglass-outline' },
  { key: 'types', label: 'Document Types', icon: 'document-text-outline' },
];

type GateState = 'checking' | 'available' | 'not-in-plan';

export function DocumentsScreen() {
  const [tab, setTab] = useState<TabKey>('requests');
  const [gate, setGate] = useState<GateState>('checking');

  useEffect(() => {
    let cancelled = false;
    listDocumentTypes()
      .then(() => { if (!cancelled) setGate('available'); })
      .catch((err) => {
        if (cancelled) return;
        setGate(isFeatureNotInPlanError(err) ? 'not-in-plan' : 'available');
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <ScreenBackground>
      <ScreenHeader title="Documents" subtitle="Requests, reviews and expiries" back />
      {gate === 'checking' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : gate === 'not-in-plan' ? (
        <ScrollView contentContainerStyle={styles.center}>
          <Card style={styles.planCard}>
            <View style={styles.planIcon}>
              <Ionicons name="lock-closed-outline" size={28} color={colors.warning} />
            </View>
            <Text style={styles.planTitle}>Not available on your plan</Text>
            <Text style={styles.planMsg}>
              Document requests and uploads aren't included in your school's current plan. Ask your school
              administrator to upgrade to unlock this feature.
            </Text>
          </Card>
        </ScrollView>
      ) : (
        <>
          <View style={styles.tabsWrap}>
            <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
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
        </>
      )}
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  tabsWrap: { paddingBottom: 12 },
  tabs: { gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 40 },
  planCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  planIcon: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.warningBg, marginBottom: 4,
  },
  planTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  planMsg: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 8, lineHeight: 19 },
}));
