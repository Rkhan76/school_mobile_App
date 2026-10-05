import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, themed } from '../../../theme/tokens';
import { searchGuardians } from '../../common/api';
import type { GuardianLookupItem } from '../../common/types';

type Props = {
  /** Currently chosen guardian id, or null when nothing is picked. */
  value: string | null;
  onChange: (id: string | null, name?: string) => void;
};

const DEBOUNCE_MS = 350;

/** Debounced "search an existing guardian" text input used when isGuardianExist is toggled on. */
export function GuardianPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [results, setResults] = useState<GuardianLookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  // If the parent clears the picked id (e.g. toggling the "has guardian" switch off/on), reset locally too.
  useEffect(() => {
    if (!value) setSelectedName(null);
  }, [value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q || q === selectedName) {
      setResults([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const myReq = ++reqIdRef.current;
      setLoading(true);
      searchGuardians({ search: q, limit: 20 })
        .then((res) => {
          if (reqIdRef.current === myReq) setResults(res.data);
        })
        .catch(() => {
          if (reqIdRef.current === myReq) setResults([]);
        })
        .finally(() => {
          if (reqIdRef.current === myReq) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selectedName]);

  const pick = (item: GuardianLookupItem) => {
    setSelectedName(item.name);
    setQuery(item.name);
    setResults([]);
    setOpen(false);
    onChange(item.id, item.name);
  };

  const clear = () => {
    setQuery('');
    setSelectedName(null);
    setResults([]);
    onChange(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>SEARCH EXISTING GUARDIAN</Text>
      <View style={styles.box}>
        <Ionicons name="search-outline" size={18} color={colors.textHint} />
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setOpen(true);
            if (!t.trim()) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type a guardian's name"
          placeholderTextColor={colors.textHint}
          style={styles.input}
          autoCorrect={false}
        />
        {loading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        {query.length > 0 ? (
          <Pressable onPress={clear} hitSlop={10} accessibilityLabel="Clear guardian search">
            <Ionicons name="close-circle" size={18} color={colors.textHint} />
          </Pressable>
        ) : null}
      </View>

      {value ? (
        <View style={styles.selectedPill}>
          <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
          <Text style={styles.selectedText} numberOfLines={1}>
            {selectedName ? `Linked: ${selectedName}` : 'A guardian is linked'}
          </Text>
          <Pressable onPress={clear} hitSlop={10}>
            <Text style={styles.change}>Change</Text>
          </Pressable>
        </View>
      ) : null}

      {open && results.length > 0 ? (
        <View style={styles.dropdown}>
          {results.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => pick(item)}
              style={[styles.row, i > 0 && styles.rowBorder]}
            >
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.rowText}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {open && !loading && query.trim().length > 0 && query !== selectedName && results.length === 0 ? (
        <Text style={styles.empty}>No matching guardians found</Text>
      ) : null}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
  box: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.cardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  input: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text, padding: 0 },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mintSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.primaryDeep },
  change: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.primary },
  dropdown: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  empty: { fontFamily: fonts.body, fontSize: 12, color: colors.textHint, paddingHorizontal: 2 },
}));
