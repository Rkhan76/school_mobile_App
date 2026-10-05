import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { DateInput } from '../../components/ui/DateInput';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ------------------------------ BottomSheet ------------------------------ */

export function BottomSheet({
  visible, title, onClose, children, tall,
}: { visible: boolean; title?: string; onClose: () => void; children: ReactNode; tall?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={sheet.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[sheet.box, tall && { height: '85%' }, { paddingBottom: insets.bottom + 16 }]}>
          <View style={sheet.grab} />
          {title ? <Text style={sheet.title}>{title}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const sheet = themed(() => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10,51,48,0.45)', justifyContent: 'flex-end' },
  box: {
    backgroundColor: colors.cardSolid, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: '85%', gap: 10,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  title: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
}));

/* ------------------------------ OptionSheet ------------------------------ */

export type Option = { value: string; label: string; sub?: string };

type OptionProps = {
  visible: boolean;
  title: string;
  /** label of the clear row (value ''); omit to hide it */
  allLabel?: string;
  options: Option[];
  value: string;
  searchable?: boolean;
  onSelect: (v: string) => void;
  onClose: () => void;
};

export function OptionSheet({ visible, title, allLabel, options, value, searchable, onSelect, onClose }: OptionProps) {
  const [q, setQ] = useState('');
  useEffect(() => { if (visible) setQ(''); }, [visible]);
  const needle = q.trim().toLowerCase();
  const list = needle ? options.filter((o) => o.label.toLowerCase().includes(needle) || (o.sub ?? '').toLowerCase().includes(needle)) : options;
  const rows: Option[] = allLabel && !needle ? [{ value: '', label: allLabel }, ...list] : list;
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose} tall={searchable}>
      {searchable ? (
        <View style={opt.search}>
          <Ionicons name="search-outline" size={16} color={colors.textHint} />
          <TextInput
            value={q} onChangeText={setQ} placeholder="Search..." placeholderTextColor={colors.textHint}
            style={opt.searchInput} autoCorrect={false}
          />
        </View>
      ) : null}
      <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
        {rows.map((o) => {
          const active = o.value === value;
          return (
            <Pressable key={o.value || '__all'} onPress={() => onSelect(o.value)} style={[opt.row, active && opt.rowActive]}>
              <View style={{ flex: 1 }}>
                <Text style={[opt.text, active && opt.textActive]}>{o.label}</Text>
                {o.sub ? <Text style={opt.sub}>{o.sub}</Text> : null}
              </View>
              {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
        {rows.length === 0 ? <Text style={opt.none}>No results</Text> : null}
      </ScrollView>
    </BottomSheet>
  );
}

const opt = themed(() => StyleSheet.create({
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12,
    borderRadius: radius.md, backgroundColor: colors.mintSoft, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.text, padding: 0 },
  row: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md },
  rowActive: { backgroundColor: colors.mintSoft },
  text: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  textActive: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  sub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  none: { textAlign: 'center', paddingVertical: 24, fontFamily: fonts.body, color: colors.textSecondary },
}));

/* ------------------------------ Form pieces ------------------------------ */

export function PickerField({
  label, value, placeholder, onPress, disabled, error,
}: { label: string; value: string | null; placeholder: string; onPress: () => void; disabled?: boolean; error?: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={form.label}>{label}</Text>
      <Pressable
        onPress={onPress} disabled={disabled} accessibilityRole="button"
        style={[form.input, form.pick, !!error && form.inputErr, disabled && { opacity: 0.55 }]}
      >
        <Text style={[form.pickText, !value && { color: colors.textHint, fontFamily: fonts.body }]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textHint} />
      </Pressable>
      {error ? <Text style={form.err}>{error}</Text> : null}
    </View>
  );
}

export function TextField({
  label, error, mono, ...rest
}: { label?: string; error?: string; mono?: boolean } & TextInputProps) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={form.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textHint}
        {...rest}
        style={[form.input, mono && { fontFamily: fonts.monoMedium }, !!error && form.inputErr, rest.style]}
      />
      {error ? <Text style={form.err}>{error}</Text> : null}
    </View>
  );
}

export function DateField({
  label, error, ...rest
}: { label?: string; error?: string } & ComponentProps<typeof DateInput>) {
  return (
    <View style={{ gap: 4 }}>
      {label ? <Text style={form.label}>{label}</Text> : null}
      <DateInput {...rest} style={[form.input, !!error && form.inputErr, rest.style]} />
      {error ? <Text style={form.err}>{error}</Text> : null}
    </View>
  );
}

export const form = themed(() => StyleSheet.create({
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.mintSoft,
  },
  inputErr: { borderColor: colors.danger },
  pick: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickText: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.text },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
}));

export function Button({
  label, onPress, icon, variant = 'primary', disabled, flex,
}: { label: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'soft' | 'danger'; disabled?: boolean; flex?: boolean }) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.dangerBg : colors.mint;
  const fg = variant === 'primary' ? colors.white : variant === 'danger' ? colors.danger : colors.primaryDeep;
  return (
    <Pressable
      onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={[btn.base, { backgroundColor: bg }, flex && { flex: 1 }, disabled && { opacity: 0.5 }]}
    >
      {icon ? <Ionicons name={icon} size={17} color={fg} /> : null}
      <Text style={[btn.text, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

const btn = themed(() => StyleSheet.create({
  base: { height: 46, paddingHorizontal: 16, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  text: { fontFamily: fonts.bodySemi, fontSize: 14 },
}));

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[cb.box, checked && cb.on]}>
      {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
    </View>
  );
}

const cb = themed(() => StyleSheet.create({
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: colors.textHint, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
}));

/* --------------------------- Lists: states etc. --------------------------- */

export function EmptyState({ icon, title, sub }: { icon: IconName; title: string; sub?: string }) {
  return (
    <View style={misc.empty}>
      <Ionicons name={icon} size={44} color={colors.textHint} />
      <Text style={misc.emptyTitle}>{title}</Text>
      {sub ? <Text style={misc.emptySub}>{sub}</Text> : null}
    </View>
  );
}

export function SkeletonCard({ height = 150 }: { height?: number }) {
  return <View style={[misc.skel, { height }]} />;
}

export function Pagination({
  page, pageSize, total, onChange,
}: { page: number; pageSize: number; total: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <View style={pg.wrap}>
      <Text style={pg.info}>Showing {from} to {to} of {total} entries</Text>
      <View style={pg.row}>
        <Pressable style={[pg.btn, page <= 1 && { opacity: 0.4 }]} disabled={page <= 1} onPress={() => onChange(page - 1)} accessibilityLabel="Previous page">
          <Ionicons name="chevron-back" size={16} color={colors.primaryDeep} />
        </Pressable>
        <Text style={pg.page}>Page {page} of {pages}</Text>
        <Pressable style={[pg.btn, page >= pages && { opacity: 0.4 }]} disabled={page >= pages} onPress={() => onChange(page + 1)} accessibilityLabel="Next page">
          <Ionicons name="chevron-forward" size={16} color={colors.primaryDeep} />
        </Pressable>
      </View>
    </View>
  );
}

export function Row({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: string }) {
  return (
    <View style={misc.kv}>
      <Text style={misc.k}>{label}</Text>
      <Text style={[misc.v, mono && { fontFamily: fonts.monoMedium }, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

const pg = themed(() => StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  info: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn: { width: 40, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mint },
  page: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
}));

const misc = themed(() => StyleSheet.create({
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  skel: { borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  k: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  v: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.text, flexShrink: 1, textAlign: 'right' },
}));
