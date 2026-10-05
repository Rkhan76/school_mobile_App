import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { ScreenBackground } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import type { DateCtl } from './DateBar';
import { addDays, dmyToIso, isFuture, isoToDmy, TODAY_ISO } from './dateUtils';
import { confirmDiscard } from './guards';
import { StaffTab } from './StaffTab';
import { StudentTab } from './StudentTab';

type TabKey = 'student' | 'staff';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'student', label: 'Student', icon: 'school-outline' },
  { key: 'staff', label: 'Staff', icon: 'briefcase-outline' },
];

export function AttendanceScreen() {
  const navigation = useNavigation();
  const [tab, setTab] = useState<TabKey>('staff');
  const [text, setText] = useState(isoToDmy(TODAY_ISO));
  const [loaded, setLoaded] = useState(TODAY_ISO);
  const [error, setError] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const onDirtyChange = useCallback((d: boolean) => {
    dirtyRef.current = d;
  }, []);

  // Unsaved-changes guard for back / hardware back.
  useEffect(() => {
    const sub = navigation.addListener('beforeRemove', (e) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      Alert.alert('Discard changes?', 'You have unsaved attendance. Leave without saving?', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
      ]);
    });
    return sub;
  }, [navigation]);

  const apply = useCallback((iso: string) => {
    confirmDiscard(dirtyRef.current, () => {
      setError(null);
      setText(isoToDmy(iso));
      setLoaded(iso);
    });
  }, []);

  const ctl: DateCtl = useMemo(
    () => ({
      text,
      error,
      loaded,
      onChangeText: (t) => {
        // Auto-insert slashes while typing digits.
        const digits = t.replace(/[^\d]/g, '').slice(0, 8);
        let v = digits;
        if (digits.length > 4) v = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        else if (digits.length > 2) v = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        setText(v);
        setError(null);
      },
      onLoad: () => {
        const iso = dmyToIso(text);
        if (!iso) return setError('Enter a valid date as DD/MM/YYYY');
        if (isFuture(iso)) return setError('Date cannot be in the future');
        if (iso !== loaded) return apply(iso);
        setError(null);
      },
      onShift: (days) => {
        const next = addDays(loaded, days);
        if (isFuture(next)) return setError('Date cannot be in the future');
        apply(next);
      },
      onToday: () => apply(TODAY_ISO),
    }),
    [text, error, loaded, apply],
  );

  const switchTab = (k: TabKey) => {
    if (k !== tab) confirmDiscard(dirtyRef.current, () => setTab(k));
  };

  return (
    <ScreenBackground>
      <ScreenHeader title="Attendance" back />
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => switchTab(t.key)} style={[styles.tab, on && styles.tabOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <Ionicons name={t.icon} size={16} color={on ? colors.white : colors.textSecondary} />
              <Text style={[styles.tabText, on && { color: colors.white }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {tab === 'staff' ? (
          <StaffTab ctl={ctl} onDirtyChange={onDirtyChange} />
        ) : (
          <StudentTab ctl={ctl} onDirtyChange={onDirtyChange} />
        )}
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = themed(() => StyleSheet.create({
  tabs: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, padding: 4, borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  tab: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.pill },
  tabOn: { backgroundColor: colors.primary },
  tabText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.textSecondary },
}));
