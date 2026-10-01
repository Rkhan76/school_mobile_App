import { Linking, Pressable, Switch, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors } from '../../theme/tokens';
import { cardStyles, IconBtn, IdPill, InfoRow, Name } from './cardParts';
import type { NonTeachingStaff } from './mockEmployees';

type Props = {
  staff: NonTeachingStaff;
  onPress: (s: NonTeachingStaff) => void;
  onToggle: (s: NonTeachingStaff, active: boolean) => void;
  onDelete: (s: NonTeachingStaff) => void;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function StaffCard({ staff: s, onPress, onToggle, onDelete }: Props) {
  const active = s.status === 'Active';
  return (
    <Pressable onPress={() => onPress(s)}>
      <Card style={cardStyles.card}>
        <View style={cardStyles.head}>
          <Avatar name={s.fullName} size={46} />
          <View style={cardStyles.headText}>
            <Name>{s.fullName}</Name>
            <IdPill id={s.staffId} />
          </View>
          <Badge label={s.status} tone={active ? 'success' : 'danger'} />
        </View>
        <View style={cardStyles.info}>
          <InfoRow icon="briefcase-outline" text={s.designation} />
          <InfoRow icon="business-outline" text={s.department} />
          <InfoRow icon="calendar-outline" text={`Joined ${formatDate(s.joiningDate)}`} />
          <InfoRow icon="document-text-outline" text={s.contractType} />
          <InfoRow icon="call-outline" text={s.phone} />
        </View>
        <View style={cardStyles.actions}>
          <IconBtn icon="call-outline" label="Call staff" onPress={() => void Linking.openURL(`tel:${s.phone.replace(/\s/g, '')}`)} />
          <View style={cardStyles.spacer} />
          <Switch
            value={active}
            onValueChange={(v) => onToggle(s, v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
          />
          <IconBtn icon="trash-outline" label="Delete staff" danger onPress={() => onDelete(s)} />
        </View>
      </Card>
    </Pressable>
  );
}
