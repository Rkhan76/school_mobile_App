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
import { useClassDetail, type ClassSection } from './classDetail';
import { AttendanceTab, ExamsTab, FeeTab, HomeworkTab, SubjectsTab } from './OtherTabs';
import { StudentListTab } from './StudentListTab';

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
  const { data, isLoading, error } = useClassDetail(id);
  const [tab, setTab] = useState<ClassTabKey>('students');
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [activeId, setActiveId] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (data) {
      setSections(data.sections);
      setActiveId(data.sections[0]?.id ?? '');
    }
  }, [data]);

  const section = sections.find((s) => s.id === activeId) ?? sections[0];

  const addSection = (name: string) => {
    const sec: ClassSection = {
      id: `S${Date.now()}`, name, classTeacher: 'Unassigned', capacity: 30, students: [],
      attendance: { present: 0, absent: 0, late: 0 }, fee: { collected: 0, pending: 0, dues: [] },
    };
    setSections((p) => [...p, sec]);
    setActiveId(sec.id);
    setAddOpen(false);
  };

  const renameSection = (name: string) => {
    setSections((p) => p.map((s) => (s.id === section?.id ? { ...s, name } : s)));
    setEditOpen(false);
  };

  const confirmDelete = () => {
    if (!section) return;
    if (sections.length <= 1) {
      Alert.alert('Cannot delete', 'A class must have at least one section.');
      return;
    }
    Alert.alert('Delete section', `Delete ${section.name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const rest = sections.filter((s) => s.id !== section.id);
          setSections(rest);
          setActiveId(rest[0]?.id ?? '');
        },
      },
    ]);
  };

  const subtitle = section ? `Class teacher • ${section.classTeacher} • Capacity ${section.capacity}` : undefined;

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader back title={data?.name ?? 'Class'} subtitle={subtitle} />
        {isLoading && <Skeleton />}
        {!isLoading && (error || !data || !section) && (
          <View style={styles.pad}>
            <NotFound message={error?.message ?? 'Class not found'} />
          </View>
        )}
        {!isLoading && data && section && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
              <ActionButton icon="create-outline" label={`Edit ${section.name}`} onPress={() => setEditOpen(true)} />
              <ActionButton icon="trash-outline" label={`Delete ${section.name}`} onPress={confirmDelete} tone="danger" />
              <ActionButton icon="add" label="Add Section" onPress={() => setAddOpen(true)} tone="primary" />
            </ScrollView>
            <SectionChips sections={sections} activeId={section.id} onChange={setActiveId} />
            <TabChips active={tab} onChange={setTab} />
            <View style={styles.pad}>
              {tab === 'students' && <StudentListTab key={section.id} students={section.students} />}
              {tab === 'attendance' && <AttendanceTab section={section} />}
              {tab === 'subjects' && <SubjectsTab subjects={data.subjects} />}
              {tab === 'fee' && <FeeTab section={section} />}
              {tab === 'exams' && <ExamsTab exams={data.exams} />}
              {tab === 'homework' && <HomeworkTab homework={data.homework} />}
            </View>
          </>
        )}
      </ScrollView>
      <SectionNameModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={addSection} />
      <SectionNameModal
        visible={editOpen}
        title="Edit Section"
        confirmLabel="Save"
        initialName={section?.name ?? ''}
        onClose={() => setEditOpen(false)}
        onSubmit={renameSection}
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
