import { Linking, Pressable, Switch, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/tokens';
import { cardStyles, IconBtn, IdPill, InfoRow, Name } from './cardParts';
import type { EmployeeStatus, NTSListItem } from './types';

type Props = {
  staff: NTSListItem;
  onPress: (s: NTSListItem) => void;
  onToggleStatus: (s: NTSListItem, next: EmployeeStatus) => void;
  onToggleBlock: (s: NTSListItem) => void;
  canUpdateStatus: boolean;
  canToggleBlock: boolean;
};

const STATUS_TONE: Record<EmployeeStatus, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  INACTIVE: 'warning',
  TERMINATED: 'danger',
};

export function StaffCard({ staff: s, onPress, onToggleStatus, onToggleBlock, canUpdateStatus, canToggleBlock }: Props) {
  const active = s.status === 'ACTIVE';
  return (
    <Pressable onPress={() => onPress(s)}>
      <Card style={cardStyles.card}>
        <View style={cardStyles.head}>
          <Avatar name={s.fullName} size={46} />
          <View style={cardStyles.headText}>
            <Name>{s.fullName}</Name>
            <IdPill id={s.employeeCode || s.staffId} />
          </View>
          <Badge label={s.status} tone={STATUS_TONE[s.status]} />
        </View>
        <View style={cardStyles.info}>
          {s.designation ? <InfoRow icon="briefcase-outline" text={s.designation} /> : null}
          {s.department ? <InfoRow icon="business-outline" text={s.department} /> : null}
          {s.phone ? <InfoRow icon="call-outline" text={s.phone} /> : null}
          {s.email ? <InfoRow icon="mail-outline" text={s.email} /> : null}
        </View>
        <View style={cardStyles.actions}>
          {s.phone ? (
            <IconBtn
              icon="call-outline"
              label="Call staff"
              onPress={() => void Linking.openURL(`tel:${s.phone!.replace(/\s/g, '')}`)}
            />
          ) : null}
          <View style={cardStyles.spacer} />
          {canUpdateStatus ? (
            <Switch
              value={active}
              onValueChange={(v) => onToggleStatus(s, v ? 'ACTIVE' : 'INACTIVE')}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          ) : null}
          {canToggleBlock ? (
            <IconBtn icon="trash-outline" label="Block staff" danger onPress={() => onToggleBlock(s)} />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
