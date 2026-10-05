import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { BottomSheet, Button, Row } from './parts';
import { formatDate, formatINR, statusTone, type Receipt } from './mockFees';

type Props = { receipt: Receipt | null; onClose: () => void };

/** Payment receipt summary shown after a successful collection. */
export function ReceiptSheet({ receipt: r, onClose }: Props) {
  return (
    <BottomSheet visible={r !== null} onClose={onClose}>
      {r ? (
        <>
          <View style={styles.hero}>
            <View style={styles.tick}><Ionicons name="checkmark" size={26} color={colors.white} /></View>
            <Text style={styles.title}>Payment received</Text>
            <Text style={styles.total}>{formatINR(r.total)}</Text>
          </View>
          <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8 }}>
            <Row label="Receipt no." value={r.receiptNo} mono />
            <Row label="Date" value={formatDate(r.date)} />
            <Row label="Student" value={`${r.studentName} (${r.className})`} />
            <Row label="Mode" value={r.mode} />
            {r.reference ? <Row label="Reference" value={r.reference} mono /> : null}
            <View style={styles.lines}>
              {r.lines.map((l) => (
                <View key={l.invoiceNo} style={styles.line}>
                  <Text style={styles.lineNo}>{l.invoiceNo}</Text>
                  <Badge label={l.status} tone={statusTone(l.status)} />
                  <Text style={styles.lineAmt}>{formatINR(l.amount)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <Button
              label="Share" icon="share-outline" variant="soft" flex
              onPress={() => Alert.alert('Share receipt', 'Sharing receipts is coming soon.')}
            />
            <Button
              label="Download" icon="download-outline" variant="soft" flex
              onPress={() => Alert.alert('Download receipt', 'Downloading receipts is coming soon.')}
            />
          </View>
          <Button label="Done" onPress={onClose} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = themed(() => StyleSheet.create({
  hero: { alignItems: 'center', gap: 4, paddingVertical: 6 },
  tick: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text, marginTop: 4 },
  total: { fontFamily: fonts.headingExtra, fontSize: 28, color: colors.primaryDeep },
  lines: { gap: 8, backgroundColor: colors.mintSoft, borderRadius: radius.lg, padding: 12, marginTop: 4 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineNo: { flex: 1, fontFamily: fonts.monoMedium, fontSize: 12, color: colors.text },
  lineAmt: { fontFamily: fonts.heading, fontSize: 13, color: colors.text, minWidth: 70, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10 },
}));
