import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts } from '../../src/theme/tokens';
import { useSession } from '../../src/features/auth/session';

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

if (__DEV__) {
  groups.push({
    title: 'DEVELOPER',
    items: [{ label: 'Network Logger', icon: 'code-slash-outline', href: '/dev/network-logger' }],
  });
}

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 18 },
  group: { gap: 8 },
  groupTitle: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1, color: colors.textHint, paddingLeft: 4 },
  card: { padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  disabled: { opacity: 0.5 },
  iconTile: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.text },
  soon: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textHint },
});
