import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../../theme/tokens';
import type { AuditData, AuditValue } from './mockAuditLogs';

type Props = { before?: AuditData; after?: AuditData };

const show = (v: AuditValue): string => JSON.stringify(v);

type Line = { key: string; sign: ' ' | '-' | '+'; text: string };

function buildLines(before: AuditData, after: AuditData): Line[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const lines: Line[] = [];
  for (const k of keys) {
    const inB = k in before;
    const inA = k in after;
    if (inB && inA && before[k] === after[k]) {
      lines.push({ key: `${k}-s`, sign: ' ', text: `${k}: ${show(after[k])}` });
    } else {
      if (inB) lines.push({ key: `${k}-b`, sign: '-', text: `${k}: ${show(before[k])}` });
      if (inA) lines.push({ key: `${k}-a`, sign: '+', text: `${k}: ${show(after[k])}` });
    }
  }
  return lines;
}

/** Before/after diff: removed/old values in red, added/new values in green. */
export function JsonDiff({ before, after }: Props) {
  if (!before && !after) {
    return <Text style={styles.none}>No data changes were recorded for this action.</Text>;
  }
  const lines = buildLines(before ?? {}, after ?? {});
  return (
    <View style={styles.box}>
      <Text style={styles.brace}>{'{'}</Text>
      {lines.map((l) => (
        <View key={l.key} style={[styles.line, l.sign === '-' && styles.del, l.sign === '+' && styles.add]}>
          <Text style={[styles.sign, l.sign === '-' && styles.delText, l.sign === '+' && styles.addText]}>{l.sign}</Text>
          <Text style={[styles.code, l.sign === '-' && styles.delText, l.sign === '+' && styles.addText]}>{l.text}</Text>
        </View>
      ))}
      <Text style={styles.brace}>{'}'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.mintSoft, paddingVertical: 8, overflow: 'hidden' },
  brace: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary, paddingHorizontal: 12 },
  line: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 2 },
  del: { backgroundColor: colors.dangerBg },
  add: { backgroundColor: colors.successBg },
  sign: { width: 10, fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textHint },
  code: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.text },
  delText: { color: colors.danger },
  addText: { color: colors.success },
  none: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint },
});
