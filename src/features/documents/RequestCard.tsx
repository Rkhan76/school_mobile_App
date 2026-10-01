import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import { ActionBtn, InfoRow, RoleTag, infoText } from './parts';
import { formatDate, isOverdue, type DocumentRequest } from './mockDocuments';

type Props = {
  item: DocumentRequest;
  onRemind: (r: DocumentRequest) => void;
  onCancel: (r: DocumentRequest) => void;
};

const STATUS_LABEL = { OPEN: 'Open', FULFILLED: 'Fulfilled', CANCELLED: 'Cancelled' } as const;
const STATUS_TONE = { OPEN: 'primary', FULFILLED: 'success', CANCELLED: 'neutral' } as const;

function RequestCardBase({ item, onRemind, onCancel }: Props) {
  const overdue = isOverdue(item);
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <Avatar name={item.personName} size={40} />
        <View style={styles.titles}>
          <Text style={styles.name} numberOfLines={1}>{item.personName}</Text>
          <View style={styles.sub}>
            <RoleTag role={item.role} />
          </View>
        </View>
        {overdue ? <Badge label="Overdue" tone="danger" /> : <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />}
      </View>

      <View style={styles.doc}>
        <Text style={styles.docName}>{item.documentName}</Text>
        {item.note ? <Text style={styles.docNote}>{item.note}</Text> : null}
      </View>

      <View style={styles.rows}>
        <InfoRow label="Due">
          <Text style={[infoText, overdue && { color: colors.danger }]}>{formatDate(item.dueDate)}</Text>
        </InfoRow>
        <InfoRow label="Status">
          <Badge label={STATUS_LABEL[item.status]} tone={STATUS_TONE[item.status]} />
        </InfoRow>
        <InfoRow label="Requested by"><Text style={infoText}>{item.requestedBy}</Text></InfoRow>
        <InfoRow label="Last reminded">
          <Text style={infoText}>{item.lastRemindedAt ? formatDate(item.lastRemindedAt) : 'Never'}</Text>
        </InfoRow>
      </View>

      {item.status === 'OPEN' ? (
        <View style={styles.actions}>
          <ActionBtn label="Remind" icon="notifications-outline" onPress={() => onRemind(item)} />
          <ActionBtn label="Cancel" icon="close" tone="danger" onPress={() => onCancel(item)} />
        </View>
      ) : null}
    </Card>
  );
}

export const RequestCard = memo(RequestCardBase);

const styles = StyleSheet.create({
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
});
