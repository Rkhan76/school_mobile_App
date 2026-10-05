import type { ComponentProps, ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, themed } from '../../theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ------------------------------ Chip ------------------------------ */

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityState={{ selected: on }}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------ Checkbox ------------------------------ */

export function Checkbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <View style={[styles.box, checked && styles.boxOn, disabled && styles.boxDisabled]}>
      {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
    </View>
  );
}

/* ------------------------------ BottomSheet ------------------------------ */

type SheetProps = { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode };

export function BottomSheet({ visible, title, subtitle, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHead}>
            <View style={styles.flex}>
              <Text style={styles.sheetTitle}>{title}</Text>
              {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
            </View>
            <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close">
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

/* ------------------------------ FullModal ------------------------------ */

type FullProps = { visible: boolean; title: string; onClose: () => void; children: ReactNode; footer?: ReactNode };

/** Full-screen modal with a close button header and an optional pinned footer. */
export function FullModal({ visible, title, onClose, children, footer }: FullProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fullRoot} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.fullHead, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} style={styles.sheetClose} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.fullTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.flex}>{children}</View>
        {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FooterButtons({
  cancelLabel = 'Cancel', saveLabel, onCancel, onSave, saveDisabled,
}: { cancelLabel?: string; saveLabel: string; onCancel: () => void; onSave: () => void; saveDisabled?: boolean }) {
  return (
    <View style={styles.btnRow}>
      <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel}>
        <Text style={styles.cancelText}>{cancelLabel}</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.save, saveDisabled && styles.disabled]} onPress={onSave} disabled={saveDisabled}>
        <Text style={styles.saveText}>{saveLabel}</Text>
      </Pressable>
    </View>
  );
}

/* ------------------------------ Pagination ------------------------------ */

type PagProps = { page: number; pageSize: number; total: number; onChange: (p: number) => void };

export function Pagination({ page, pageSize, total, onChange }: PagProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <View style={styles.pagWrap}>
      <Text style={styles.pagInfo}>Showing {from}–{to} of {total}</Text>
      {pages > 1 ? (
        <View style={styles.pagRow}>
          <Pressable style={[styles.pagBtn, page <= 1 && styles.disabled]} disabled={page <= 1} onPress={() => onChange(page - 1)}>
            <Text style={styles.pagBtnText}>Prev</Text>
          </Pressable>
          <Text style={styles.pagPage}>Page {page} of {pages}</Text>
          <Pressable style={[styles.pagBtn, page >= pages && styles.disabled]} disabled={page >= pages} onPress={() => onChange(page + 1)}>
            <Text style={styles.pagBtnText}>Next</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------ EmptyState ------------------------------ */

export function EmptyState({ icon, title, sub }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={44} color={colors.textHint} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );
}

export function SkeletonBlock({ height }: { height: number }) {
  return <View style={{ height, borderRadius: radius.xl, backgroundColor: colors.mint, opacity: 0.7 }} />;
}

export const formStyles = themed(() => StyleSheet.create({
  form: { paddingHorizontal: 16, paddingBottom: 16, gap: 6 },
  label: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 46,
    fontFamily: fonts.body, fontSize: 14, color: colors.text, backgroundColor: colors.cardSolid,
  },
  inputErr: { borderColor: colors.danger },
  err: { fontFamily: fonts.body, fontSize: 12, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
}));

const styles = themed(() => StyleSheet.create({
  flex: { flex: 1 },
  chip: {
    height: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: radius.pill,
    backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.textSecondary },
  chipTextOn: { color: colors.white },
  box: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.textHint,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid,
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxDisabled: { opacity: 0.55 },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10,51,48,0.45)' },
  sheet: {
    maxHeight: '85%', backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
    paddingHorizontal: 16, paddingTop: 8,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 10 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sheetTitle: { fontFamily: fonts.heading, fontSize: 18, color: colors.text },
  sheetSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  sheetClose: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid },
  fullRoot: { flex: 1, backgroundColor: colors.background },
  fullHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  fullTitle: { flex: 1, fontFamily: fonts.heading, fontSize: 20, color: colors.text },
  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardSolid },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 46, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  cancel: { backgroundColor: colors.mint },
  cancelText: { fontFamily: fonts.bodySemi, color: colors.primaryDeep },
  save: { backgroundColor: colors.primary },
  saveText: { fontFamily: fonts.bodySemi, color: colors.white },
  disabled: { opacity: 0.4 },
  pagWrap: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  pagInfo: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  pagRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pagBtn: { height: 38, paddingHorizontal: 16, justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.mint },
  pagBtnText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primaryDeep },
  pagPage: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.text },
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.text },
  emptySub: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
}));
