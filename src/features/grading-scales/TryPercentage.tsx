import { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius } from '../../theme/tokens';
import { gradeFor, type GradeBand, type GradingScale } from './mockGrading';

type Props = {
  scale: GradingScale | null;
  onPickScale: () => void;
};

type Result = { kind: 'band'; band: GradeBand; percent: number } | { kind: 'error'; message: string } | null;

export function TryPercentage({ scale, onPickScale }: Props) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Result>(null);

  const check = () => {
    Keyboard.dismiss();
    if (!scale) return;
    const n = Number(text.trim());
    if (!text.trim() || !Number.isFinite(n) || n < 0 || n > 100) {
      setResult({ kind: 'error', message: 'Enter a percentage between 0 and 100.' });
      return;
    }
    const band = gradeFor(scale, n);
    setResult(band ? { kind: 'band', band, percent: n } : { kind: 'error', message: 'No band covers this percentage.' });
  };

  return (
    <Card style={styles.card}>
      <View style={styles.title}>
        <Ionicons name="calculator-outline" size={18} color={colors.primary} />
        <Text style={styles.titleText}>Try a percentage</Text>
      </View>
      <Pressable style={styles.select} onPress={onPickScale}>
        <Text style={styles.selectText} numberOfLines={1}>{scale?.name ?? 'Select scale'}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </Pressable>
      <View style={styles.row}>
        <TextInput
          value={text}
          onChangeText={(t) => { setText(t.replace(/[^0-9.]/g, '')); setResult(null); }}
          placeholder="e.g. 83"
          placeholderTextColor={colors.textHint}
          keyboardType="decimal-pad"
          maxLength={6}
          style={styles.input}
          onSubmitEditing={check}
        />
        <Pressable style={[styles.btn, !scale && styles.btnOff]} onPress={check} disabled={!scale}>
          <Text style={styles.btnText}>Check grade</Text>
        </Pressable>
      </View>
      {result?.kind === 'error' ? <Text style={styles.err}>{result.message}</Text> : null}
      {result?.kind === 'band' ? (
        <View style={[styles.result, { backgroundColor: result.band.isPass ? colors.successBg : colors.dangerBg }]}>
          <Text style={[styles.grade, { color: result.band.isPass ? colors.success : colors.danger }]}>{result.band.label}</Text>
          <View style={styles.resultTexts}>
            <Text style={styles.resultMain}>
              {result.percent}% falls in {result.band.minPercent}-{result.band.maxPercent}%
            </Text>
            <Text style={styles.resultSub}>
              {result.band.isPass ? 'Pass' : 'Fail'}
              {result.band.gradePoint !== null ? ` · Grade point ${result.band.gradePoint}` : ''}
            </Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  title: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  select: {
    height: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.mintSoft, gap: 8,
  },
  selectText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  btn: { height: 46, paddingHorizontal: 16, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnOff: { opacity: 0.5 },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  result: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md },
  grade: { fontFamily: fonts.headingExtra, fontSize: 28, minWidth: 48 },
  resultTexts: { flex: 1, gap: 2 },
  resultMain: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text },
  resultSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
