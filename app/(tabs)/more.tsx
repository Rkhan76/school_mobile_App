import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, themed } from '../../src/theme/tokens';
import { useSession } from '../../src/features/auth/session';
import { useTheme, type ThemeMode } from '../../src/theme/ThemeProvider';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

type Item = { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; href?: Href };
type Group = { title: string; items: Item[] };

// Mirrors the web sidebar groups. Items without `href` are not built yet.
const groups: Group[] = [
  {
    title: 'PEOPLE',
    items: [
      { label: 'Promotion', icon: 'trending-up-outline', href: '/promotion' },
      { label: 'Admissions', icon: 'document-text-outline', href: '/admissions' },
      { label: 'Employees', icon: 'people-outline', href: '/employees' },
      { label: 'Guardians', icon: 'person-outline' },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      { label: 'Classes', icon: 'albums-outline', href: '/classes' },
      { label: 'Subjects', icon: 'book-outline', href: '/subjects' },
      { label: 'Master Table', icon: 'settings-outline', href: '/master-table' },
      { label: 'Examinations', icon: 'checkbox-outline', href: '/examinations' },
      { label: 'Syllabus', icon: 'list-outline', href: '/syllabus' },
      { label: 'Grading Scales', icon: 'scale-outline', href: '/grading-scales' },
      { label: 'Attendance', icon: 'checkmark-done-outline', href: '/attendance' },
      { label: 'Timetable', icon: 'calendar-outline', href: '/timetable' },
    ],
  },
  {
    title: 'FINANCE',
    items: [{ label: 'Ledgers', icon: 'business-outline', href: '/ledgers' }],
  },
  {
    title: 'HR',
    items: [
      { label: 'Certificates', icon: 'shield-checkmark-outline', href: '/certificates' },
      { label: 'Leave Requests', icon: 'calendar-outline', href: '/leave-requests' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { label: 'Notice Board', icon: 'megaphone-outline', href: '/notices' },
      { label: 'Events', icon: 'ribbon-outline', href: '/events' },
      { label: 'Messages', icon: 'chatbubbles-outline', href: '/messages' },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Members', icon: 'people-circle-outline', href: '/members' },
      { label: 'Documents', icon: 'folder-open-outline', href: '/documents' },
      { label: 'School Documents', icon: 'archive-outline', href: '/school-documents' },
      { label: 'Reports', icon: 'bar-chart-outline', href: '/reports' },
      { label: 'Audit Logs', icon: 'time-outline', href: '/audit-logs' },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useTheme();
  return (
    <ScreenBackground>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        {groups.map((g) => (
          <View key={g.title} style={styles.group}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <Card style={styles.card}>
              {g.items.map((it, i) => (
                <Pressable
                  key={it.label}
                  disabled={!it.href}
                  onPress={() => it.href && router.push(it.href)}
                  style={[styles.row, i > 0 && styles.rowBorder, !it.href && styles.disabled]}
                >
                  <View style={styles.iconTile}>
                    <Ionicons name={it.icon} size={18} color={colors.primaryDeep} />
                  </View>
                  <Text style={styles.label}>{it.label}</Text>
                  {it.href ? (
                    <Ionicons name="chevron-forward" size={18} color={colors.textHint} />
                  ) : (
                    <Text style={styles.soon}>Soon</Text>
                  )}
                </Pressable>
              ))}
            </Card>
          </View>
        ))}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>APPEARANCE</Text>
          <Card style={styles.card}>
            <View style={styles.themeRow}>
              {THEME_OPTIONS.map((o) => {
                const active = mode === o.mode;
                return (
                  <Pressable
                    key={o.mode}
                    onPress={() => setMode(o.mode)}
                    style={[styles.themeOption, active && styles.themeOptionActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${o.label} theme`}
                  >
                    <Ionicons name={o.icon} size={16} color={active ? colors.white : colors.textSecondary} />
                    <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </View>
        <View style={styles.group}>
          <Card style={styles.card}>
            <Pressable
              onPress={async () => {
                await useSession.getState().logout();
                router.replace('/login');
              }}
              style={styles.row}
            >
              <View style={styles.iconTile}>
                <Ionicons name="log-out-outline" size={18} color={colors.primaryDeep} />
              </View>
              <Text style={styles.label}>Sign Out</Text>
            </Pressable>
          </Card>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 18 },
  group: { gap: 8 },
  groupTitle: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1, color: colors.textHint, paddingLeft: 4 },
  card: { padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  disabled: { opacity: 0.5 },
  iconTile: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  themeRow: { flexDirection: 'row', gap: 6, padding: 4 },
  themeOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 40, borderRadius: 12,
  },
  themeOptionActive: { backgroundColor: colors.primary },
  themeLabel: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  themeLabelActive: { color: colors.white },
  soon: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textHint },
}));
