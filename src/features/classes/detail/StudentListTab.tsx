import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Card } from '../../../components/ui/Card';
import { SearchBar } from '../../../components/ui/SearchBar';
import { colors, fonts } from '../../../theme/tokens';
import type { ClassStudent } from './classDetail';

function StudentRow({ s, onPress }: { s: ClassStudent; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${s.name}`}>
      <Card style={styles.row}>
        <View style={styles.sl}>
          <Text style={styles.slText}>{s.sl}</Text>
        </View>
        <Avatar name={s.name} size={38} />
        <View style={styles.mid}>
          <Text style={styles.name} numberOfLines={1}>{s.name}</Text>
          <Text style={styles.adm} numberOfLines={1}>{s.admissionNo}</Text>
        </View>
        <View style={styles.roll}>
          <Text style={styles.rollLabel}>ROLL NO</Text>
          <Text style={styles.rollValue}>{s.rollNo}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textHint} />
      </Card>
    </Pressable>
  );
}

export function StudentListTab({ students }: { students: ClassStudent[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? students.filter((s) => s.name.toLowerCase().includes(t) || s.admissionNo.toLowerCase().includes(t)) : students;
  }, [q, students]);

  return (
    <View style={styles.wrap}>
      <SearchBar value={q} onChangeText={setQ} placeholder="Search by name or admission no..." />
      {list.length === 0 ? (
        <Card style={styles.empty}>
          <Ionicons name="search-outline" size={32} color={colors.textHint} />
          <Text style={styles.emptyText}>No students match your search</Text>
        </Card>
      ) : (
        list.map((s) => (
          <StudentRow key={s.id} s={s} onPress={() => router.push({ pathname: '/student/[id]', params: { id: s.id } })} />
        ))
      )}
      <Text style={styles.footer}>
        {list.length === 0 ? 'Showing 0 entries' : `Showing 1 to ${list.length} of ${list.length} entries`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 18 },
  sl: { width: 24, alignItems: 'center' },
  slText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  mid: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodySemi, fontSize: 14.5, color: colors.text },
  adm: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSecondary },
  roll: { alignItems: 'center', minWidth: 44 },
  rollLabel: { fontFamily: fonts.bodyMedium, fontSize: 9, letterSpacing: 0.6, color: colors.textHint },
  rollValue: { fontFamily: fonts.heading, fontSize: 15, color: colors.primaryDeep },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  footer: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
