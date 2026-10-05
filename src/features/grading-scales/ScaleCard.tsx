import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { BandChip } from './BandChip';
import type { GradingScale } from './mockGrading';

type Props = {
  scale: GradingScale;
  onMakeDefault: (s: GradingScale) => void;
  onEdit: (s: GradingScale) => void;
  onDelete: (s: GradingScale) => void;
};

export function ScaleCard({ scale, onMakeDefault, onEdit, onDelete }: Props) {
  const n = scale.bands.length;
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.name}>{scale.name}</Text>
        {scale.isDefault ? <Badge label="Default" tone="primary" /> : null}
      </View>
      {scale.description ? <Text style={styles.desc}>{scale.description}</Text> : null}
      <Text style={styles.meta}>Pass line: {scale.passPercent}% · {n} band{n === 1 ? '' : 's'}</Text>
      <View style={styles.chips}>
        {scale.bands.map((b) => <BandChip key={b.id} band={b} />)}
      </View>
      <View style={styles.actions}>
        {!scale.isDefault ? (
          <Pressable style={styles.btn} onPress={() => onMakeDefault(scale)}>
            <Ionicons name="star-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.btnText}>Make default</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.btn} onPress={() => onEdit(scale)}>
          <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.btnText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.del, scale.isDefault && styles.disabled]}
          disabled={scale.isDefault}
          onPress={() => onDelete(scale)}
          accessibilityState={{ disabled: scale.isDefault }}
          accessibilityHint={scale.isDefault ? 'The default scale cannot be deleted' : undefined}
        >
          <Ionicons name="trash-outline" size={14} color={colors.danger} />
          <Text style={[styles.btnText, { color: colors.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  desc: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  meta: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textHint },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  actions: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 6,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border,
  },
  btn: {
    height: 36, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  btnText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.text },
  del: { borderColor: colors.dangerBorder },
  disabled: { opacity: 0.4 },
}));
