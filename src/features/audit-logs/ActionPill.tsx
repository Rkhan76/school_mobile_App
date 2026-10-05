import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';

/**
 * The server sends no human-readable label for `action` — it's a raw dot-case
 * string (per the doc, e.g. "student.promoted"). This is a purely client-side
 * nicety: a small, deliberately incomplete lookup for common codes. Anything not
 * in the map just falls back to showing the raw string — never block on having a
 * complete mapping.
 */
const ACTION_LABELS: Record<string, string> = {
  'admission.approved': 'Admission approved',
  'admission.rejected': 'Admission rejected',
  'admission.cancelled': 'Admission cancelled',
  'student.promoted': 'Student promoted',
  'student.profile.updated': 'Student profile updated',
  'fee.payment.created': 'Fee payment recorded',
  'fee.structure.updated': 'Fee structure updated',
  'exam-result.locked': 'Exam results locked',
  'exam-result.record.create': 'Exam result entered',
  'exam-schedule.record.create': 'Exam scheduled',
  'attendance.marked': 'Attendance marked',
  'notice.created': 'Notice created',
  'auth.login': 'User logged in',
  'auth.logout': 'User logged out',
  'school_user.deactivated': 'Staff account deactivated',
  'entity-document.uploaded': 'Document uploaded',
  'entity-document.approved': 'Document approved',
  'entity-document.accessed': 'Document accessed',
  'school-document.created': 'School document created',
  'school-document.classified-accessed': 'Confidential document accessed',
};

/** Teal pill for an audit action code — friendly label when known, raw code otherwise. */
export function ActionPill({ action }: { action: string }) {
  const label = ACTION_LABELS[action];
  return (
    <View style={styles.pill}>
      <Text style={styles.text} numberOfLines={1}>{label ?? action}</Text>
      {label ? (
        <Text style={styles.code} numberOfLines={1}>{action}</Text>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  pill: { alignSelf: 'flex-start', maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: colors.mint, gap: 1 },
  text: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primaryDeep },
  code: { fontFamily: fonts.mono, fontSize: 10, color: colors.primaryDeep, opacity: 0.7 },
}));
