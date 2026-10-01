import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius } from '../../theme/tokens';
import { MembersTab } from './MembersTab';
import { PermissionsTab } from './PermissionsTab';
import { RolesTab } from './RolesTab';
import type { IconName } from './mockMembers';

type TabKey = 'members' | 'roles' | 'permissions';
const TABS: { key: TabKey; label: string; icon: IconName }[] = [
  { key: 'members', label: 'Members', icon: 'people-outline' },
  { key: 'roles', label: 'Roles', icon: 'shield-checkmark-outline' },
  { key: 'permissions', label: 'Permissions', icon: 'key-outline' },
];

export function MembersScreen() {
  const [tab, setTab] = useState<TabKey>('members');

  return (
    <ScreenBackground>
      <ScreenHeader title="Members & Access" subtitle="Manage people, roles and permissions" back />
      <View style={styles.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => {
            const on = t.key === tab;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.chip, on && styles.chipOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Ionicons name={t.icon} size={15} color={on ? colors.white : colors.text} />
                <Text style={[styles.chipText, on && { color: colors.white }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <View style={styles.body}>
        {tab === 'members' ? <MembersTab /> : tab === 'roles' ? <RolesTab /> : <PermissionsTab />}
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  tabsWrap: { paddingBottom: 12 },
  tabs: { gap: 8, paddingHorizontal: 16 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14,
    borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  body: { flex: 1 },
});
