import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, themed } from '../../theme/tokens';
import { formatDate, isOverdueRequest } from './dateUtils';
import { ActionBtn, InfoRow, RoleTag, infoText } from './parts';
import { ENTITY_LABELS, type DocumentRequestRow } from './types';

type Props = {
  item: DocumentRequestRow;
  canUpdate: boolean;
  onRemind: (r: DocumentRequestRow) => void;
  onCancel: (r: DocumentRequestRow) => void;
};

const STATUS_LABEL = { OPEN: 'Open', SUBMITTED: 'Submitted', FULFILLED: 'Fulfilled', CANCELLED: 'Cancelled' } as const;
const STATUS_TONE = { OPEN: 'primary', SUBMITTED: 'warning', FULFILLED: 'success', CANCELLED: 'neutral' } as const;

function RequestCardBase({ item, canUpdate, onRemind, onCancel }: Props) {
  const overdue = isOverdueRequest(item);
  const displayName = item.entityName ?? `${ENTITY_LABELS[item.entityType]} ${item.entityId.slice(0, 8)}`;

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Avatar name={displayName} size={40} />
        <View style={styles.titles}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <View style={styles.sub}>
            <RoleTag role={ENTITY_LABELS[item.entityType]} />
          </View>
        </View>
        {overdue ? <Badge label="Overdue" tone="danger" /> : <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />}
      </View>

      <View style={styles.doc}>
        <Text style={styles.docName}>{item.documentTypeName}</Text>
        {item.note ? <Text style={styles.docNote}>{item.note}</Text> : null}
      </View>

      <View style={styles.rows}>
        <InfoRow label="Due">
          <Text style={[infoText, overdue && { color: colors.danger }]}>{item.dueDate ? formatDate(item.dueDate) : 'No due date'}</Text>
        </InfoRow>
        <InfoRow label="Status">
          <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
        </InfoRow>
      </View>

      {item.status === 'OPEN' && canUpdate ? (
        <View style={styles.actions}>
          <ActionBtn label="Remind" icon="notifications-outline" onPress={() => onRemind(item)} />
          <ActionBtn label="Cancel" icon="close" tone="danger" onPress={() => onCancel(item)} />
        </View>
      ) : null}
    </Card>
  );
}

export const RequestCard = memo(RequestCardBase);

const styles = themed(() => StyleSheet.create({
  card: { gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titles: { flex: 1, gap: 3 },
  name: { fontFamily: fonts.heading, fontSize: 15, color: colors.text },
  sub: { flexDirection: 'row' },
  doc: { gap: 1 },
  docName: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  docNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint },
  rows: { gap: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
}));
