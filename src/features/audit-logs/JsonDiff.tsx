import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, themed } from '../../theme/tokens';

type Props = { before: Record<string, unknown> | null; after: Record<string, unknown> | null };

const show = (v: unknown): string => {
  try {
    const s = JSON.stringify(v);
    return s === undefined ? 'undefined' : s;
  } catch {
    return String(v);
  }
};

type Line = { key: string; sign: ' ' | '-' | '+'; text: string };

function buildLines(before: Record<string, unknown>, after: Record<string, unknown>): Line[] {
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  const lines: Line[] = [];
  for (const k of keys) {
    const inB = k in before;
    const inA = k in after;
    // Cheap deep-equality via serialization — good enough for a read-only diff view.
    if (inB && inA && show(before[k]) === show(after[k])) {
      lines.push({ key: `${k}-s`, sign: ' ', text: `${k}: ${show(after[k])}` });
    } else {
      if (inB) lines.push({ key: `${k}-b`, sign: '-', text: `${k}: ${show(before[k])}` });
      if (inA) lines.push({ key: `${k}-a`, sign: '+', text: `${k}: ${show(after[k])}` });
    }
  }
  return lines;
}

function isPlainRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Before/after diff for `oldValue`/`newValue`. Per the doc, these aren't populated
 * for every action (some call sites still log them as null) — render a clear
 * "no data" state rather than an empty diff that looks like a bug. They're raw
 * JSON snapshots, so a non-object shape (e.g. an array) falls back to a plain
 * side-by-side dump instead of a key-by-key diff.
 */
export function JsonDiff({ before, after }: Props) {
  if (before === null && after === null) {
    return <Text style={styles.none}>No before/after data was recorded for this entry.</Text>;
  }

  if ((before !== null && !isPlainRecord(before)) || (after !== null && !isPlainRecord(after))) {
    return (
      <View style={styles.box}>
        {before !== null ? <Text style={[styles.code, styles.delText]}>- {show(before)}</Text> : null}
        {after !== null ? <Text style={[styles.code, styles.addText]}>+ {show(after)}</Text> : null}
      </View>
    );
  }

  const lines = buildLines(before ?? {}, after ?? {});
  if (lines.length === 0) {
    return <Text style={styles.none}>No before/after data was recorded for this entry.</Text>;
  }

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

const styles = themed(() => StyleSheet.create({
  box: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.mintSoft, paddingVertical: 8, overflow: 'hidden' },
  brace: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSecondary, paddingHorizontal: 12 },
  line: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 2 },
  del: { backgroundColor: colors.dangerBg },
  add: { backgroundColor: colors.successBg },
  sign: { width: 10, fontFamily: fonts.monoMedium, fontSize: 12, color: colors.textHint },
  code: { flex: 1, fontFamily: fonts.mono, fontSize: 12, color: colors.text, paddingHorizontal: 12, paddingVertical: 2 },
  delText: { color: colors.danger },
  addText: { color: colors.success },
  none: { fontFamily: fonts.body, fontSize: 13, color: colors.textHint },
}));
