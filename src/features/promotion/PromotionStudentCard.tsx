import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { Checkbox } from './Checkbox';
import { SelectField } from './SelectField';
import {
  CAN_SKIP_CLASS, CLASSES, DECISIONS, needsTarget,
  type Decision, type PromotionRow, type PromotionStudent,
} from './mockPromotion';

type Props = {
  student: PromotionStudent;
  row: PromotionRow;
  selected: boolean;
  onToggle: (id: string) => void;
  onDecision: (id: string, d: Decision) => void;
  onTarget: (id: string, classId: string) => void;
};

const DECISION_OPTIONS = DECISIONS.filter((d) => CAN_SKIP_CLASS || d.value !== 'skip');

function PromotionStudentCardBase({ student, row, selected, onToggle, onDecision, onTarget }: Props) {
  return (
    <Card style={[styles.card, !selected && styles.dim]}>
      <View style={styles.top}>
        <Checkbox checked={selected} onPress={() => onToggle(student.id)} label={`Select ${student.name}`} />
        <Avatar name={student.name} size={38} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{student.name}</Text>
          <Text style={styles.adm} numberOfLines={1}>{student.admissionNo} · {student.section}</Text>
        </View>
        <Badge label={`Roll ${student.roll}`} tone="neutral" />
      </View>
      <View style={styles.selects}>
        <SelectField
          compact
          label="Decision"
          title="Decision"
          placeholder="Decision"
          value={row.decision}
          options={DECISION_OPTIONS}
          onChange={(v) => onDecision(student.id, v as Decision)}
        />
        <SelectField
          compact
          label="Target class"
          title="Target class"
          placeholder="-"
          value={row.targetClassId}
          options={CLASSES}
          disabled={!needsTarget(row.decision)}
          onChange={(v) => onTarget(student.id, v)}
        />
      </View>
      {row.decision === 'skip' && row.reason ? (
        <Text style={styles.reason} numberOfLines={2}>Reason: {row.reason}</Text>
      ) : null}
    </Card>
  );
}

export const PromotionStudentCard = memo(PromotionStudentCardBase);

const styles = StyleSheet.create({
  card: { padding: 12, gap: 10, borderRadius: 18 },
  dim: { opacity: 0.6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  name: { fontFamily: fonts.headingSemi, fontSize: 15, color: colors.text },
  adm: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  selects: { flexDirection: 'row', gap: 10 },
  reason: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
});
