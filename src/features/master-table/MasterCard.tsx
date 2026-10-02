import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { colors, fonts } from '../../theme/tokens';
import type { CardView } from './config';

type Props = {
  view: CardView;
  toggle?: { label: string; value: boolean; onChange: (v: boolean) => void };
  onSetActive?: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function MasterCard({ view, toggle, onSetActive, onEdit, onDelete }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titles}>
          <Text style={styles.title}>{view.title}</Text>
          {view.lines.map((l) => <Text key={l} style={styles.line}>{l}</Text>)}
        </View>
        <View style={styles.badges}>
          {view.badges.map((b) => <Badge key={b.label} label={b.label} tone={b.tone} />)}
        </View>
      </View>
      <View style={styles.actions}>
        {toggle ? (
          <View style={styles.toggle}>
            <Switch
              value={toggle.value}
              onValueChange={toggle.onChange}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
            <Text style={styles.toggleText}>{toggle.label}</Text>
          </View>
        ) : null}
        {onSetActive ? (
          <Pressable style={styles.setActive} onPress={onSetActive} accessibilityLabel="Set Active">
            <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
            <Text style={styles.setActiveText}>Set Active</Text>
          </Pressable>
        ) : null}
        <View style={styles.spacer} />
        <Pressable style={styles.iconBtn} onPress={onEdit} accessibilityLabel="Edit" hitSlop={6}>
          <Ionicons name="pencil" size={17} color={colors.blue} />
        </Pressable>
        <Pressable style={[styles.iconBtn, styles.del]} onPress={onDelete} accessibilityLabel="Delete" hitSlop={6}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12, padding: 14 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titles: { flex: 1, gap: 3 },
  title: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  line: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  badges: { gap: 6, alignItems: 'flex-end' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  setActive: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 10, borderRadius: 17, backgroundColor: colors.successBg },
  setActiveText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.success },
  spacer: { flex: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f0fe' },
  del: { backgroundColor: colors.dangerBg },
});
