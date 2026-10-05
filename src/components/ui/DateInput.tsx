import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, fonts, radius, themed } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeProvider';
import { formatDate, maskDateInput, parseDisplayDate } from '../../lib/date';

const pad = (n: number) => String(n).padStart(2, '0');

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'maxLength'> & {
  /** `dd/mm/yyyy`, or `dd/mm/yyyy HH:mm` when `withTime` is set. */
  value: string;
  onChangeText: (value: string) => void;
  /** Also pick a time and emit `dd/mm/yyyy HH:mm` (24h). */
  withTime?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Wrapper around the input + calendar icon (use for flex/margins that the bare TextInput had). */
  containerStyle?: StyleProp<ViewStyle>;
};

/** Reads `dd/mm/yyyy[ HH:mm]` into a Date for the picker; falls back to now. */
function toPickerDate(text: string, withTime: boolean): Date {
  const iso = parseDisplayDate(text.slice(0, 10));
  if (!iso) return new Date();
  const [y, m, d] = iso.split('-').map(Number);
  let h = 0;
  let min = 0;
  if (withTime) {
    const t = /(\d{1,2}):(\d{2})/.exec(text.slice(10));
    if (t) {
      h = Number(t[1]);
      min = Number(t[2]);
    }
  }
  return new Date(y, m - 1, d, h, min);
}

function fromPickerDate(d: Date, withTime: boolean): string {
  return withTime ? `${formatDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` : formatDate(d);
}

/**
 * Date field that accepts typing (auto-slashes) and also opens the system calendar from the icon.
 * Drop-in replacement for the `TextInput` of a date field: pass the same `style`/`placeholder`.
 */
export function DateInput({
  value,
  onChangeText,
  withTime = false,
  minimumDate,
  maximumDate,
  containerStyle,
  style,
  placeholder,
  editable = true,
  ...rest
}: Props) {
  const { resolved } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(new Date());

  const open = () => {
    const current = toPickerDate(value, withTime);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        maximumDate,
        onValueChange: (_e, picked) => {
          if (!withTime) {
            onChangeText(fromPickerDate(picked, false));
            return;
          }
          DateTimePickerAndroid.open({
            value: new Date(picked.getFullYear(), picked.getMonth(), picked.getDate(), current.getHours(), current.getMinutes()),
            mode: 'time',
            is24Hour: true,
            onValueChange: (_te, time) => onChangeText(fromPickerDate(time, true)),
          });
        },
      });
      return;
    }
    setIosDraft(current);
    setIosOpen(true);
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      <TextInput
        {...rest}
        value={value}
        onChangeText={(t) => onChangeText(withTime ? t : maskDateInput(t))}
        keyboardType={withTime ? 'numbers-and-punctuation' : 'number-pad'}
        maxLength={withTime ? 16 : 10}
        placeholder={placeholder ?? (withTime ? 'dd/mm/yyyy HH:mm' : 'dd/mm/yyyy')}
        placeholderTextColor={rest.placeholderTextColor ?? colors.textHint}
        editable={editable}
        style={[style, styles.inputPad]}
      />
      <Pressable
        style={styles.icon}
        onPress={open}
        disabled={!editable}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Pick date from calendar"
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primaryDeep} />
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal visible={iosOpen} transparent animationType="slide" onRequestClose={() => setIosOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIosOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <View style={styles.sheetBar}>
                <Pressable onPress={() => setIosOpen(false)} hitSlop={8}>
                  <Text style={styles.sheetCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChangeText(fromPickerDate(iosDraft, withTime));
                    setIosOpen(false);
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.sheetDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={iosDraft}
                mode={withTime ? 'datetime' : 'date'}
                display="spinner"
                themeVariant={resolved}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                is24Hour
                onValueChange={(_e, d) => setIosDraft(d)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { justifyContent: 'center' },
    inputPad: { paddingRight: 44 },
    icon: { position: 'absolute', right: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,51,48,0.45)' },
    sheet: {
      backgroundColor: colors.cardSolid,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingBottom: 24,
    },
    sheetBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
    sheetCancel: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.textSecondary },
    sheetDone: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.primaryDeep },
  }),
);
