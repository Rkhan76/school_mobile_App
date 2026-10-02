import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme/tokens';
import { formatTime } from './format';
import { DELETED_TEXT, ME_ID, type ChatMessage } from './mockMessages';

const SENDER_COLORS = [colors.blue, colors.indigo, colors.purple, colors.orange, colors.primaryDark, '#db2777'];

function senderColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
  return SENDER_COLORS[h % SENDER_COLORS.length];
}

type Props = {
  message: ChatMessage;
  /** show the sender name above (first of a run in group chats) */
  showSender: boolean;
  onLongPress?: (m: ChatMessage) => void;
};

function MessageBubbleImpl({ message, showSender, onLongPress }: Props) {
  const own = message.senderId === ME_ID;
  const deleted = message.deleted;
  return (
    <View style={[styles.row, own ? styles.rowOwn : styles.rowOther]}>
      {!own && showSender ? (
        <Text style={[styles.sender, { color: senderColor(message.senderId) }]}>{message.senderName}</Text>
      ) : null}
      <Pressable
        onLongPress={own && !deleted && onLongPress ? () => onLongPress(message) : undefined}
        delayLongPress={300}
        style={[
          styles.bubble,
          own ? styles.bubbleOwn : styles.bubbleOther,
          deleted && styles.bubbleDeleted,
        ]}
      >
        <Text style={[styles.text, own && !deleted && styles.textOwn, deleted && styles.textDeleted]}>
          {deleted ? DELETED_TEXT : message.text}
        </Text>
      </Pressable>
      <View style={styles.meta}>
        <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
        {own && !deleted ? <Ionicons name="checkmark-done" size={14} color={colors.primary} /> : null}
      </View>
    </View>
  );
}

export const MessageBubble = memo(MessageBubbleImpl);

const styles = StyleSheet.create({
  row: { maxWidth: '82%', marginVertical: 3 },
  rowOwn: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  rowOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  sender: { fontFamily: fonts.bodySemi, fontSize: 12, marginBottom: 3, marginLeft: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  bubbleOwn: { backgroundColor: colors.primary, borderBottomRightRadius: 5 },
  bubbleOther: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 5 },
  bubbleDeleted: { backgroundColor: '#f3f6f5', borderWidth: 1, borderColor: colors.border },
  text: { fontFamily: fonts.body, fontSize: 14.5, lineHeight: 20, color: colors.text },
  textOwn: { color: colors.white },
  textDeleted: { fontStyle: 'italic', color: colors.textHint },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginHorizontal: 4 },
  time: { fontFamily: fonts.body, fontSize: 10.5, color: colors.textHint },
});
