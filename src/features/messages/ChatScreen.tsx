import { useCallback, useMemo } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { colors, fonts, radius } from '../../theme/tokens';
import { ChatInput } from './ChatInput';
import { DaySeparator } from './DaySeparator';
import { dayKey, dayLabel } from './format';
import { GroupAvatar } from './GroupRow';
import { MessageBubble } from './MessageBubble';
import { personName, useGroup, useMessages, type ChatMessage } from './mockMessages';

type Item =
  | { type: 'day'; id: string; label: string }
  | { type: 'msg'; id: string; message: ChatMessage; showSender: boolean };

/** Builds newest-first items (for an inverted list) with day separators and sender-run flags. */
function buildItems(messages: ChatMessage[]): Item[] {
  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const out: Item[] = [];
  sorted.forEach((m, i) => {
    const prev = sorted[i - 1];
    const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
    if (newDay) out.push({ type: 'day', id: `day-${m.id}`, label: dayLabel(m.createdAt) });
    out.push({ type: 'msg', id: m.id, message: m, showSender: newDay || prev.senderId !== m.senderId });
  });
  return out.reverse();
}

export function ChatScreen({ groupId }: { groupId: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { group, leave } = useGroup(groupId);
  const { data, isLoading, send, remove, typing } = useMessages(groupId);
  const items = useMemo(() => buildItems(data), [data]);

  const onLongPress = useCallback((m: ChatMessage) => {
    Alert.alert('Message', undefined, [
      { text: 'Delete message', style: 'destructive', onPress: () => remove(m.id) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [remove]);

  const showMenu = () => {
    if (!group) return;
    Alert.alert(group.name, undefined, [
      {
        text: 'Group info',
        onPress: () =>
          Alert.alert(
            group.name,
            `${group.description || 'No description'}\n\nMembers (${group.memberIds.length}):\n${group.memberIds
              .map(personName)
              .join('\n')}`,
          ),
      },
      {
        text: 'Leave group',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Leave group', `Leave ${group.name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Leave', style: 'destructive', onPress: () => { leave(); router.back(); } },
          ]),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/messages'));

  return (
    <ScreenBackground>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={goBack} style={styles.back} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <GroupAvatar name={group?.name ?? '?'} size={40} />
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>{group?.name ?? 'Group not found'}</Text>
          {group ? (
            <Text style={styles.subtitle}>
              {group.memberIds.length} member{group.memberIds.length === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
        {group ? (
          <Pressable onPress={showMenu} style={styles.back} accessibilityLabel="More options">
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </Pressable>
        ) : null}
      </View>

      {!group ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={colors.textHint} />
          <Text style={styles.emptyTitle}>This group does not exist</Text>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {isLoading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.skeleton, i % 2 === 0 ? styles.skLeft : styles.skRight]} />
              ))}
            </View>
          ) : (
            <FlatList
              style={styles.flex}
              data={items}
              inverted
              keyExtractor={(i) => i.id}
              renderItem={({ item }) =>
                item.type === 'day' ? (
                  <DaySeparator label={item.label} />
                ) : (
                  <MessageBubble message={item.message} showSender={item.showSender} onLongPress={onLongPress} />
                )
              }
              ListHeaderComponent={
                typing ? (
                  <View style={styles.typing}>
                    <Text style={styles.typingText}>{typing} is typing…</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={[styles.center, styles.flip]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={44} color={colors.textHint} />
                  <Text style={styles.emptyTitle}>No messages yet</Text>
                  <Text style={styles.emptySub}>Say hello to start the conversation.</Text>
                </View>
              }
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            />
          )}
          <ChatInput onSend={send} />
        </KeyboardAvoidingView>
      )}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid,
  },
  titles: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  subtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  list: { paddingHorizontal: 14, paddingVertical: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 48 },
  flip: { transform: [{ scaleY: -1 }] },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  typing: {
    alignSelf: 'flex-start', marginVertical: 4, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.lg, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  typingText: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', color: colors.textSecondary },
  skeletons: { flex: 1, padding: 16, gap: 12, justifyContent: 'flex-end' },
  skeleton: { height: 44, width: '60%', borderRadius: 18, backgroundColor: colors.mint, opacity: 0.7 },
  skLeft: { alignSelf: 'flex-start' },
  skRight: { alignSelf: 'flex-end' },
});
