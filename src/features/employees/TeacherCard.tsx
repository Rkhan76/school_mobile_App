import { Linking, Pressable, Switch, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/tokens';
import { cardStyles, IconBtn, IdPill, InfoRow, Name } from './cardParts';
import type { EmployeeStatus, TeacherEntity } from './types';

type Props = {
  teacher: TeacherEntity;
  onView: (t: TeacherEntity) => void;
  onToggleStatus: (t: TeacherEntity, next: EmployeeStatus) => void;
  onToggleBlock: (t: TeacherEntity) => void;
  canUpdateStatus: boolean;
  canToggleBlock: boolean;
};

const STATUS_TONE: Record<EmployeeStatus, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TERMINATED: 'danger',
};

export function TeacherCard({ teacher: t, onView, onToggleStatus, onToggleBlock, canUpdateStatus, canToggleBlock }: Props) {
  const status = t.status ?? 'ACTIVE';
  const active = status === 'ACTIVE';
  const designation = t.designation || t.workLocation;

  return (
    <Pressable onPress={() => onView(t)}>
      <Card style={cardStyles.card}>
        <View style={cardStyles.head}>
          <Avatar name={t.fullName} size={46} />
          <View style={cardStyles.headText}>
            <Name>{t.fullName}</Name>
            <IdPill id={t.employeeCode || t.staffId || t.id} />
          </View>
          <Badge label={status} tone={STATUS_TONE[status]} />
        </View>
        <View style={cardStyles.info}>
          {designation ? <InfoRow icon="briefcase-outline" text={designation} /> : null}
          {t.qualification || t.experience ? (
            <InfoRow
              icon="ribbon-outline"
              text={[t.qualification, t.experience ? `${t.experience}` : null].filter(Boolean).join(' • ')}
            />
          ) : null}
          {t.shift ? <InfoRow icon="time-outline" text={`${t.shift} shift`} /> : null}
          {t.phone ? <InfoRow icon="call-outline" text={t.phone} /> : null}
          {t.email ? <InfoRow icon="mail-outline" text={t.email} /> : null}
        </View>
        <View style={cardStyles.actions}>
          <IconBtn icon="eye-outline" label="View teacher" onPress={() => onView(t)} />
          {t.phone ? (
            <IconBtn
              icon="call-outline"
              label="Call teacher"
              onPress={() => void Linking.openURL(`tel:${t.phone!.replace(/\s/g, '')}`)}
            />
          ) : null}
          <View style={cardStyles.spacer} />
          {canUpdateStatus ? (
            <Switch
              value={active}
              onValueChange={(v) => onToggleStatus(t, v ? 'ACTIVE' : 'INACTIVE')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          ) : null}
          {canToggleBlock ? (
            <IconBtn icon="trash-outline" label="Block teacher" danger onPress={() => onToggleBlock(t)} />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
