import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius } from '../../theme/tokens';
import { DocumentRows } from './OverviewTab';
import { SectionCard } from './parts';
import type { TeacherDetail } from './teacherDetail';

export function SubjectsTab({ t }: { t: TeacherDetail }) {
  return (
    <SectionCard icon="library-outline" title="Assigned Classes" right={<Text style={s.mono}>{t.assignments.length} total</Text>}>
      {t.assignments.length === 0 ? (
        <Text style={s.empty}>No current class/subject assignments.</Text>
      ) : (
        <View style={s.list}>
          {t.assignments.map((a) => (
            <View key={a.id} style={s.row}>
              <View style={s.classBox}>
                <Text style={s.classBoxText}>{a.className}-{a.section}</Text>
              </View>
              <View style={s.grow}>
                <Text style={s.rowTitle}>Class {a.className}-{a.section} {'—'} {a.subject}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </SectionCard>
  );
}

/** Not covered by this task's backend wiring — the real timetable lives in a separate
 * module (weekly slot grid, MOBILE_API_DOCS.md section 10), not the teachers controller. */
function ComingSoon({ icon, title, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; text: string }) {
  return (
    <SectionCard icon={icon} title={title}>
      <View style={s.comingSoon}>
        <Ionicons name="construct-outline" size={28} color={colors.textHint} />
        <Text style={s.comingSoonText}>{text}</Text>
      </View>
    </SectionCard>
  );
}

export function TimetableTab({ t: _t }: { t: TeacherDetail }) {
  return (
    <ComingSoon
      icon="calendar-outline"
      title="Weekly Timetable"
      text="Timetable slots live in a separate module and aren't wired up here yet."
    />
  );
}

export function AttendanceTab({ t: _t }: { t: TeacherDetail }) {
  return (
    <ComingSoon
      icon="checkmark-done-outline"
      title="Attendance"
      text="Staff attendance reporting isn't available on this screen yet."
    />
  );
}

export function PayrollTab({ t: _t }: { t: TeacherDetail }) {
  return (
    <ComingSoon
      icon="receipt-outline"
      title="Payroll"
      text="Payslip data isn't available on this screen yet."
    />
  );
}

export function DocumentsTab({ t }: { t: TeacherDetail }) {
  return (
    <SectionCard icon="shield-checkmark-outline" title="Documents">
      <DocumentRows docs={t.documents} />
    </SectionCard>
  );
}

export function ReportsTab({ t: _t }: { t: TeacherDetail }) {
  return (
    <ComingSoon
      icon="bar-chart-outline"
      title="Reports"
      text="Teacher reports aren't available on this screen yet."
    />
  );
}

const s = StyleSheet.create({
  list: { gap: 8 },
  grow: { flex: 1, gap: 2 },
  mono: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  empty: { fontFamily: fonts.body, fontSize: 12.5, color: colors.textHint },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.md,
    backgroundColor: colors.mintSoft,
  },
  rowTitle: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  classBox: { minWidth: 44, height: 36, borderRadius: 10, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  classBoxText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.primaryDeep },
  comingSoon: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  comingSoonText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 12 },
});
