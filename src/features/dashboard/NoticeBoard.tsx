import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts, themed } from '../../theme/tokens';
import { SectionHeader } from './SectionHeader';
import type { Notice } from './mockData';

interface Props {
  notices: Notice[];
  activeCount: number;
  onViewAll?: () => void;
}

export function NoticeBoard({ notices, activeCount, onViewAll }: Props) {
  return (
    <View>
      <SectionHeader title="Notice Board" pill={`${activeCount} Active`} action="View All" onActionPress={onViewAll} />
      <View style={styles.list}>
        {notices.map((n) => (
          <Card key={n.id} style={styles.card}>
            <View style={styles.top}>
              <Avatar name={n.author} size={38} />
              <View style={styles.meta}>
                <Text style={styles.author} numberOfLines={1}>{n.author}</Text>
                <Badge label={n.tag} tone={n.tagTone} />
              </View>
              <Text style={styles.date}>{n.date}</Text>
            </View>
            <Text style={styles.body}>{n.body}</Text>
          </Card>
        ))}
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  list: { gap: 10 },
  card: { gap: 10, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { flex: 1, gap: 4 },
  author: { fontFamily: fonts.heading, fontSize: 14, color: colors.text },
  date: { fontFamily: fonts.mono, fontSize: 11, color: colors.textHint, alignSelf: 'flex-start' },
  body: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
}));
