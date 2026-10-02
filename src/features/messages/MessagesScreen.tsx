import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { GroupRow } from './GroupRow';
import { NewGroupModal } from './NewGroupModal';
import { connectChatSocket, disconnectChatSocket } from './socket';
import { useGroups, type GroupTab } from './useChat';

const TABS: { key: GroupTab; label: string }[] = [
  { key: 'mine', label: 'My Chats' },
  { key: 'all', label: 'All Groups' },
];

export function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<GroupTab>('mine');
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const { data, isLoading, loadMore, loadingMore, error, canCreate, showAllGroupsTab, create } = useGroups(tab, search);

  // The socket connection lives for as long as any messages screen is in the
  // navigation stack — MessagesScreen is the entry point and stays mounted
  // under ChatScreen (expo-router keeps stack screens alive), so connecting
  // here and disconnecting on this screen's own unmount is enough to cover
  // "connect on enter / disconnect on leave" for the whole feature.
  useEffect(() => {
    connectChatSocket();
    return () => disconnectChatSocket();
  }, []);

  const tabs = useMemo(() => (showAllGroupsTab ? TABS : TABS.filter((t) => t.key !== 'all')), [showAllGroupsTab]);

  const open = useCallback(
    (id: string) => router.push({ pathname: '/messages/[id]', params: { id } }),
    [router],
  );

  const header = (
    <View style={styles.headerWrap}>
      {tabs.length > 1 ? (
        <View style={styles.segment}>
          {tabs.map((t) => {
            const on = t.key === tab;
            return (
              <Pressable key={t.key} style={[styles.segBtn, on && styles.segOn]} onPress={() => setTab(t.key)}>
                <Text style={[styles.segText, on && styles.segTextOn]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search groups" />
    </View>
  );

  if (!isLoading && error?.kind === 'plan') {
    return (
      <ScreenBackground>
        <ScreenHeader title="Messages" back />
        <View style={styles.planGate}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textHint} />
          <Text style={styles.planTitle}>Chat isn&apos;t included in your plan</Text>
          <Text style={styles.planSub}>{error.message}</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Messages"
        back
        right={
          canCreate ? (
            <Pressable style={styles.newBtn} onPress={() => setNewOpen(true)} accessibilityLabel="New group">
              <Ionicons name="add" size={22} color={colors.white} />
            </Pressable>
          ) : undefined
        }
      />
      <FlatList
        data={isLoading ? [] : data}
        keyExtractor={(g) => g.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View style={styles.itemWrap}>
            <GroupRow group={item} onPress={open} />
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={colors.primary} /> : null}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
            </View>
          ) : error ? (
            <View style={styles.empty}>
              <Ionicons name="cloud-offline-outline" size={44} color={colors.danger} />
              <Text style={styles.emptyTitle}>Couldn&apos;t load chats</Text>
              <Text style={styles.emptySub}>{error.message}</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{search ? 'No groups found' : 'No chats yet'}</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try a different search.' : canCreate ? 'Tap + to start a new group.' : "You'll see groups here once you're added to one."}
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      {canCreate ? (
        <NewGroupModal
          visible={newOpen}
          onClose={() => setNewOpen(false)}
          onSubmit={(input) => {
            create(input)
              .then((group) => {
                setTab('mine');
                setSearch('');
                setNewOpen(false);
                open(group.id);
              })
              .catch(() => setNewOpen(false));
          }}
        />
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  segment: {
    flexDirection: 'row', padding: 4, backgroundColor: colors.mint, borderRadius: radius.lg,
  },
  segBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md },
  segOn: { backgroundColor: colors.cardSolid },
  segText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
  segTextOn: { color: colors.primaryDeep },
  itemWrap: { paddingHorizontal: 16 },
  newBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primaryDarkest,
  },
  skeletons: { paddingHorizontal: 16, gap: 10 },
  skeleton: { height: 70, borderRadius: radius.lg, backgroundColor: colors.mint, opacity: 0.7 },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6, paddingHorizontal: 24 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  footerLoader: { marginVertical: 16 },
  planGate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  planTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text, textAlign: 'center' },
  planSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
