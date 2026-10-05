import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../../components/ui/Card';
import { ScreenBackground } from '../../../components/ui/Screen';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { colors, fonts, radius, themed } from '../../../theme/tokens';
import { SectionNameModal } from './AddSectionModal';
import { SectionChips, TabChips, type ClassTabKey } from './Chips';
import { ErrorState } from '../../employees/ListStates';
import { useSession } from '../../auth/session';
import { apiErrorMessage, deleteSection } from '../api';
import { useClassById, useClassSections } from '../hooks';
import { AttendanceTab, ExamsTab, FeeTab, HomeworkTab } from './OtherTabs';
import { StudentListTab } from './StudentListTab';
import { SubjectsTab } from './SubjectsTab';
import { hScrollFixed } from '../../../components/ui/scrollStyles';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function ActionButton({ icon, label, onPress, tone = 'default' }: { icon: IconName; label: string; onPress: () => void; tone?: 'default' | 'danger' | 'primary' }) {
  const fg = tone === 'primary' ? colors.white : tone === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={[styles.action, tone === 'primary' && styles.actionPrimary, tone === 'danger' && styles.actionDanger]} accessibilityRole="button">
      <Ionicons name={icon} size={15} color={fg} />
      <Text style={[styles.actionText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

function Skeleton() {
  const op = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [op]);
  const block = (h: number) => <Card style={{ height: h, backgroundColor: colors.mint }} />;
  return (
    <Animated.View style={{ opacity: op, gap: 12, paddingHorizontal: 16 }}>
      {block(40)}
      {block(48)}
      {block(60)}
      {block(60)}
      {block(60)}
    </Animated.View>
  );
}

function NotFound({ message }: { message: string }) {
  return (
    <Card style={styles.nf}>
      <Ionicons name="school-outline" size={40} color={colors.textHint} />
      <Text style={styles.nfTitle}>{message}</Text>
      <Text style={styles.nfSub}>This class could not be loaded.</Text>
    </Card>
  );
}

export function ClassDetailScreen({ id }: { id: string | undefined }) {
  const insets = useSafeAreaInsets();
  const permissions = useSession((st) => st.permissions);
  const canDeleteSection = permissions.includes('section.record.delete');
  const cls = useClassById(id);
  const secs = useClassSections(cls.data ? id : undefined);
  const data = cls.data;
  const isLoading = cls.isLoading || (!!cls.data && secs.isLoading);
  const error = cls.error ?? secs.error;
  const refetch = () => {
    cls.refetch();
    secs.refetch();
  };
  const [tab, setTab] = useState<ClassTabKey>('students');
  const [activeId, setActiveId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const sections = secs.data;
  useEffect(() => {
    setActiveId((cur) => (sections.some((s) => s.id === cur) ? cur : sections[0]?.id ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secs.data]);

  const section = sections.find((s) => s.id === activeId) ?? sections[0];

  // TODO: add / rename section stay unconnected until their request bodies are specified.
  const notConnected = () => {
    setAddOpen(false);
    setEditOpen(false);
    Alert.alert('Not connected yet');
  };

  const confirmDelete = () => {
    if (!section) return;
    Alert.alert('Delete section', `Delete ${section.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSection(section.id);
            secs.refetch();
          } catch (e) {
            Alert.alert('Could not delete section', apiErrorMessage(e));
          }
        },
      },
    ]);
  };

  const subtitle = section?.maxCapacity != null ? `Capacity ${section.maxCapacity}` : undefined;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader back title={data?.name ?? 'Class'} subtitle={subtitle} />
        {isLoading && <Skeleton />}
        {!isLoading && error && (
          <View style={styles.pad}>
            {error === 'Class not found' ? <NotFound message={error} /> : <ErrorState message={error} onRetry={refetch} />}
          </View>
        )}
        {!isLoading && !error && data && !section && (
          <View style={styles.pad}>
            <NotFound message="No sections yet" />
          </View>
        )}
        {!isLoading && !error && data && section && (
          <>
            <ScrollView horizontal style={hScrollFixed} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
              <ActionButton icon="create-outline" label={`Edit ${section.name}`} onPress={() => setEditOpen(true)} />
              {canDeleteSection ? (
                <ActionButton icon="trash-outline" label={`Delete ${section.name}`} onPress={confirmDelete} tone="danger" />
              ) : null}
              <ActionButton icon="add" label="Add Section" onPress={() => setAddOpen(true)} tone="primary" />
            </ScrollView>
            <SectionChips sections={sections} activeId={section.id} onChange={setActiveId} />
            <TabChips active={tab} onChange={setTab} />
            <View style={styles.pad}>
              {tab === 'students' && <StudentListTab key={section.id} classId={data.id} section={section} />}
              {tab === 'attendance' && <AttendanceTab sectionName={section.name} />}
              {tab === 'subjects' && <SubjectsTab key={section.id} section={section} />}
              {tab === 'fee' && <FeeTab />}
              {tab === 'exams' && <ExamsTab />}
              {tab === 'homework' && <HomeworkTab />}
            </View>
          </>
        )}
      </ScrollView>
      <SectionNameModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={notConnected} />
      <SectionNameModal
        visible={editOpen}
        title="Edit Section"
        confirmLabel="Save"
        initialName={section?.name ?? ''}
        onClose={() => setEditOpen(false)}
        onSubmit={notConnected}
      />
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  pad: { paddingHorizontal: 16 },
  actions: { gap: 8, paddingHorizontal: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  actionPrimary: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  actionDanger: { borderColor: colors.dangerBorder, backgroundColor: colors.dangerBg },
  actionText: { fontFamily: fonts.bodySemi, fontSize: 13 },
  nf: { alignItems: 'center', gap: 8, paddingVertical: 36 },
  nfTitle: { fontFamily: fonts.heading, fontSize: 17, color: colors.text },
  nfSub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
}));
