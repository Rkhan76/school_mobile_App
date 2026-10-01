import { Linking, Pressable, Switch, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/tokens';
import { cardStyles, IconBtn, IdPill, InfoRow, Name } from './cardParts';
import type { Teacher } from './mockEmployees';

type Props = {
  teacher: Teacher;
  onView: (t: Teacher) => void;
  onToggle: (t: Teacher, active: boolean) => void;
  onDelete: (t: Teacher) => void;
};

export function TeacherCard({ teacher: t, onView, onToggle, onDelete }: Props) {
  const klass = t.class ? `Class ${t.class} • Sec ${t.section ?? '-'}` : 'Unassigned';
  const active = t.status === 'Active';
  return (
    <Pressable onPress={() => onView(t)}>
      <Card style={cardStyles.card}>
        <View style={cardStyles.head}>
          <Avatar name={t.fullName} size={46} />
          <View style={cardStyles.headText}>
            <Name>{t.fullName}</Name>
            <IdPill id={t.staffId} />
          </View>
          <Badge label={t.status} tone={active ? 'success' : 'danger'} />
        </View>
        <View style={cardStyles.info}>
          <InfoRow icon="book-outline" text={t.subject} />
          <InfoRow icon="school-outline" text={klass} />
          <InfoRow icon="ribbon-outline" text={`${t.qualification} • ${t.experience} yrs`} />
          <InfoRow icon="time-outline" text={`${t.shift} shift`} />
          <InfoRow icon="call-outline" text={t.phone} />
          <InfoRow icon="mail-outline" text={t.email} />
        </View>
        <View style={cardStyles.actions}>
          <IconBtn icon="eye-outline" label="View teacher" onPress={() => onView(t)} />
          <IconBtn icon="call-outline" label="Call teacher" onPress={() => void Linking.openURL(`tel:${t.phone.replace(/\s/g, '')}`)} />
          <View style={cardStyles.spacer} />
          <Switch
            value={active}
            onValueChange={(v) => onToggle(t, v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
          <IconBtn icon="trash-outline" label="Delete teacher" danger onPress={() => onDelete(t)} />
        </View>
      </Card>
    </Pressable>
  );
}
