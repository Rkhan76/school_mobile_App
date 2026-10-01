import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../../theme/tokens';
import {
  EVENT_AUDIENCES, EVENT_STATUSES, parseInputText, parseIso, toInputText, toIso,
  type EventAudience, type EventInput, type EventStatus, type SchoolEvent,
} from './mockEvents';

type Props = {
  visible: boolean;
  /** null = create mode */
  event: SchoolEvent | null;
  /** prefill date (YYYY-MM-DD) for new events */
  defaultDay: string | null;
  onSubmit: (input: EventInput) => void;
  onClose: () => void;
};

type Errors = Partial<Record<'title' | 'start' | 'end', string>>;

const DATE_HINT = 'DD/MM/YYYY HH:mm';

function Segment<T extends string>({
  options, value, onChange,
}: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.chips}>
      {options.map((o) => (
        <Pressable key={o} onPress={() => onChange(o)} style={[styles.chip, value === o && styles.chipActive]}>
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Full-screen Create / Edit event form. */
export function EventForm({ visible, event, defaultDay, onSubmit, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<EventStatus>('UPCOMING');
  const [audience, setAudience] = useState<EventAudience>('ALL');
  const [isHoliday, setHoliday] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!visible) return;
    setErrors({});
    if (event) {
      setTitle(event.title);
      setDescription(event.description);
      setStart(toInputText(parseIso(event.startDate)));
      setEnd(toInputText(parseIso(event.endDate)));
      setLocation(event.location);
      setStatus(event.status);
      setAudience(event.audience);
      setHoliday(event.isHoliday);
    } else {
      const base = defaultDay ? parseIso(`${defaultDay}T09:00`) : new Date();
      if (!defaultDay) base.setMinutes(0, 0, 0);
      const endD = new Date(base.getTime() + 60 * 60 * 1000);
      setTitle('');
      setDescription('');
      setStart(toInputText(base));
      setEnd(toInputText(endD));
      setLocation('');
      setStatus('UPCOMING');
      setAudience('ALL');
      setHoliday(false);
    }
  }, [visible, event, defaultDay]);

  const submit = () => {
    const e: Errors = {};
    if (!title.trim()) e.title = 'Title is required.';
    const s = parseInputText(start);
    const en = parseInputText(end);
    if (!start.trim()) e.start = 'Start date is required.';
    else if (!s) e.start = `Use format ${DATE_HINT}.`;
    if (!end.trim()) e.end = 'End date is required.';
    else if (!en) e.end = `Use format ${DATE_HINT}.`;
    else if (s && en.getTime() <= s.getTime()) e.end = 'End must be after start.';
    setErrors(e);
    if (Object.keys(e).length > 0 || !s || !en) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate: toIso(s),
      endDate: toIso(en),
      location: location.trim(),
      status,
      audience,
      isHoliday,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.screen, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.bar}>
          <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.heading}>{event ? 'Edit Event' : 'Create Event'}</Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Title <Text style={styles.req}>*</Text></Text>
          <TextInput
            value={title} onChangeText={setTitle} placeholder="Event title" placeholderTextColor={colors.textHint}
            style={[styles.input, !!errors.title && styles.inputErr]}
          />
          {errors.title ? <Text style={styles.err}>{errors.title}</Text> : null}

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description} onChangeText={setDescription} placeholder="Describe the event..."
            placeholderTextColor={colors.textHint} multiline style={[styles.input, styles.multi]}
          />

          <Text style={styles.label}>Start Date <Text style={styles.req}>*</Text></Text>
          <TextInput
            value={start} onChangeText={setStart} placeholder={DATE_HINT} placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" autoCorrect={false}
            style={[styles.input, !!errors.start && styles.inputErr]}
          />
          {errors.start ? <Text style={styles.err}>{errors.start}</Text> : null}

          <Text style={styles.label}>End Date <Text style={styles.req}>*</Text></Text>
          <TextInput
            value={end} onChangeText={setEnd} placeholder={DATE_HINT} placeholderTextColor={colors.textHint}
            keyboardType="numbers-and-punctuation" autoCorrect={false}
            style={[styles.input, !!errors.end && styles.inputErr]}
          />
          {errors.end ? <Text style={styles.err}>{errors.end}</Text> : null}

          <Text style={styles.label}>Location</Text>
          <TextInput
            value={location} onChangeText={setLocation} placeholder="e.g. School Auditorium"
            placeholderTextColor={colors.textHint} style={styles.input}
          />

          <Text style={styles.label}>Status</Text>
          <Segment options={EVENT_STATUSES} value={status} onChange={setStatus} />

          <Text style={styles.label}>Audience</Text>
          <Segment options={EVENT_AUDIENCES} value={audience} onChange={setAudience} />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Mark as Holiday</Text>
              <Text style={styles.switchSub}>Highlights this event as a school holiday</Text>
            </View>
            <Switch
              value={isHoliday} onValueChange={setHoliday}
              trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={styles.submit} onPress={submit}>
            <Text style={styles.submitText}>{event ? 'Save Changes' : 'Create Event'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  close: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.cardSolid,
  },
  heading: { fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  form: { paddingHorizontal: 16, paddingBottom: 24, gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 10 },
  req: { color: colors.danger },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 48,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  multi: { height: 96, paddingTop: 12, textAlignVertical: 'top' },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, height: 36, borderRadius: radius.pill, justifyContent: 'center',
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textSecondary },
  chipTextActive: { color: colors.white, fontFamily: fonts.bodySemi },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 14,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardSolid,
  },
  switchText: { flex: 1, gap: 2 },
  switchTitle: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.text },
  switchSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.cardSolid, borderTopWidth: 1, borderTopColor: colors.border },
  submit: { height: 50, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  submitText: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.white },
});
