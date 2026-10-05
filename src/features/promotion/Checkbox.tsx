import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, themed } from '../../theme/tokens';

export function Checkbox({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[styles.box, checked && styles.checked]}
    >
      {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  box: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.textHint,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardSolid,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
}));
