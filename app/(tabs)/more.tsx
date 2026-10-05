import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { Card } from '../../src/components/ui/Card';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { colors, fonts, radius, themed } from '../../src/theme/tokens';
import { useSession } from '../../src/features/auth/session';
import { useAccess, type Access } from '../../src/features/auth/access';
import { useTheme, type ThemeMode } from '../../src/theme/ThemeProvider';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
];

type Item = { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; href?: Href; access?: Access };
type Group = { title: string; items: Item[] };

// Mirrors the web sidebar groups. Items without `href` are not built yet.
const groups: Group[] = [
  {
    title: 'PEOPLE',
    items: [
      { label: 'Promotion', icon: 'trending-up-outline', href: '/promotion', access: { hideForRoles: ['TEACHER'] } },
      { label: 'Admissions', icon: 'document-text-outline', href: '/admissions', access: { anyOf: ['admission.application.read', 'admission.application.create', 'admission.approval.update', 'admission.application.update'] } },
      { label: 'Employees', icon: 'people-outline', href: '/employees', access: { anyOf: ['teacher.list.read', 'non-teaching-staff.profile.create', 'non-teaching-staff.profile.update'] } },
      { label: 'Guardians', icon: 'person-outline', access: { hideForRoles: ['TEACHER'] } },
    ],
  },
  {
    title: 'ACADEMICS',
    items: [
      { label: 'Classes', icon: 'albums-outline', href: '/classes', access: { anyOf: ['class.list.read'] } },
      { label: 'Subjects', icon: 'book-outline', href: '/subjects', access: { anyOf: ['subject.list.read'] } },
      { label: 'Master Table', icon: 'settings-outline', href: '/master-table', access: { hideForRoles: ['TEACHER'] } },
      { label: 'Examinations', icon: 'checkbox-outline', href: '/examinations', access: { anyOf: ['exam-schedule.list.read'] } },
      { label: 'Syllabus', icon: 'list-outline', href: '/syllabus', access: { anyOf: ['syllabus.list.read'] } },
      { label: 'Grading Scales', icon: 'scale-outline', href: '/grading-scales', access: { anyOf: ['grading-scale.list.read'] } },
      { label: 'Attendance', icon: 'checkmark-done-outline', href: '/attendance', access: { anyOf: ['attendance.list.read'] } },
      { label: 'Timetable', icon: 'calendar-outline', href: '/timetable', access: { anyOf: ['timetable-slot.list.read', 'timetable-slot.self.read'] } },
    ],
  },
  {
    title: 'FINANCE',
    items: [{ label: 'Ledgers', icon: 'business-outline', href: '/ledgers', access: { hideForRoles: ['TEACHER'] } }],
  },
  {
    title: 'HR',
    items: [
      { label: 'Certificates', icon: 'shield-checkmark-outline', href: '/certificates', access: { anyOf: ['certificate.record.create', 'certificate.revocation.update'] } },
      { label: 'Leave Requests', icon: 'calendar-outline', href: '/leave-requests', access: { anyOf: ['leave-application.decision.update'] } },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { label: 'Notice Board', icon: 'megaphone-outline', href: '/notices', access: { anyOf: ['notice.list.read'] } },
      { label: 'Events', icon: 'ribbon-outline', href: '/events', access: { anyOf: ['event.list.read'] } },
      { label: 'Messages', icon: 'chatbubbles-outline', href: '/messages', access: { anyOf: ['chat.list.read'] } },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Members', icon: 'people-circle-outline', href: '/members', access: { anyOf: ['school-user.invite.create', 'school-user.password.update', 'rbac.user-role.update'] } },
      { label: 'Documents', icon: 'folder-open-outline', href: '/documents', access: { anyOf: ['document-request.list.read', 'document-request.record.update', 'document-type.record.create'] } },
      { label: 'School Documents', icon: 'archive-outline', href: '/school-documents', access: { anyOf: ['school-document.list.read'] } },
      { label: 'Reports', icon: 'bar-chart-outline', href: '/reports', access: { hideForRoles: ['TEACHER'] } },
      { label: 'Audit Logs', icon: 'time-outline', href: '/audit-logs', access: { hideForRoles: ['TEACHER'] } },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useTheme();
  const can = useAccess();
  // Only the entries this user may open; a group with nothing left is dropped.
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => can(it.access)) }))
    .filter((g) => g.items.length > 0);
  return (
    <ScreenBackground>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}>
        {visibleGroups.map((g) => (
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
        <Pressable
          onPress={async () => {
            await useSession.getState().logout();
            router.replace('/login');
          }}
          style={styles.logout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
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
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: radius.lg,
    backgroundColor: colors.dangerBg, borderWidth: 1, borderColor: colors.dangerBorder,
  },
  logoutText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.danger },
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
