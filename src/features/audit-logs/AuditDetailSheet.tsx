import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import { ActionPill } from './ActionPill';
import { JsonDiff } from './JsonDiff';
import { formatDateTime, type AuditLog } from './types';

type Props = { log: AuditLog | null; onClose: () => void };

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

/** Bottom sheet with every audit field plus the before/after diff. */
export function AuditDetailSheet({ log, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={log !== null} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        {log && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.grab} />
            <Text style={styles.title}>Audit log details</Text>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              <ActionPill action={log.action} />
              <Row label="Date & time" value={formatDateTime(log.createdAt)} />
              <Row label="Entity type" value={log.entityType} />
              <Row label="Entity ID" value={log.entityId} mono />
              <Row label="User" value={`${log.userName ?? 'Unknown user'} (${log.userType})`} />
              <Row label="User ID" value={log.userId} mono />
              {log.impersonatedBy ? (
                <Row label="Impersonated by" value={log.impersonatedByName ?? log.impersonatedBy} mono={!log.impersonatedByName} />
              ) : null}
              <Row label="IP address" value={log.ipAddress ?? '—'} mono />
              <Row label="User agent" value={log.userAgent ?? '—'} />
              <Text style={styles.section}>Changes</Text>
              {(log.oldValue !== null || log.newValue !== null) && (
                <View style={styles.legend}>
                  <Text style={[styles.legendText, { color: colors.danger }]}>- before</Text>
                  <Text style={[styles.legendText, { color: colors.success }]}>+ after</Text>
                </View>
              )}
              <JsonDiff before={log.oldValue} after={log.newValue} />
            </ScrollView>
            <Pressable style={styles.close} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 20, gap: 10, maxHeight: '85%' },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  body: { gap: 10, paddingBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint },
  value: { flex: 1, textAlign: 'right', fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  mono: { fontFamily: fonts.mono, fontSize: 12 },
  section: { fontFamily: fonts.heading, fontSize: 14, color: colors.text, marginTop: 6 },
  legend: { flexDirection: 'row', gap: 14 },
  legendText: { fontFamily: fonts.mono, fontSize: 11 },
  close: { height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.mint },
  closeText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
});
