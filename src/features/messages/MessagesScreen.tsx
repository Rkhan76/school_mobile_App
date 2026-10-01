import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SearchBar } from '../../components/ui/SearchBar';
import { colors, fonts, radius } from '../../theme/tokens';
import { GroupRow } from './GroupRow';
import { useGroups, type GroupTab } from './mockMessages';
import { NewGroupModal } from './NewGroupModal';

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
  const { data, isLoading, create } = useGroups(tab, search);

  const open = useCallback(
    (id: string) => router.push({ pathname: '/messages/[id]', params: { id } }),
    [router],
  );

  const header = (
    <View style={styles.headerWrap}>
      <View style={styles.segment}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} style={[styles.segBtn, on && styles.segOn]} onPress={() => setTab(t.key)}>
              <Text style={[styles.segText, on && styles.segTextOn]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search groups" />
    </View>
  );

  return (
    <ScreenBackground>
      <ScreenHeader
        title="Messages"
        back
        right={
          <Pressable style={styles.newBtn} onPress={() => setNewOpen(true)} accessibilityLabel="New group">
            <Ionicons name="add" size={22} color={colors.white} />
          </Pressable>
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
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletons}>
              {[0, 1, 2, 3].map((i) => <View key={i} style={styles.skeleton} />)}
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={44} color={colors.textHint} />
              <Text style={styles.emptyTitle}>{search ? 'No groups found' : 'No chats yet'}</Text>
              <Text style={styles.emptySub}>
                {search ? 'Try a different search.' : 'Tap + to start a new group.'}
              </Text>
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />
      <NewGroupModal
        visible={newOpen}
        onClose={() => setNewOpen(false)}
        onSubmit={(input) => {
          create(input);
          setTab('mine');
          setSearch('');
          setNewOpen(false);
        }}
      />
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
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
});
