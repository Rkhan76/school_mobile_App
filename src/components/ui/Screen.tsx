import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, themed } from '../../theme/tokens';

/** Mint gradient page background shared by every screen. */
export function ScreenBackground({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.topTint, colors.background, colors.bottomTint]}
        style={StyleSheet.absoluteFill}
      />
      {children}
      {/* Edge-to-edge: keep scrolled content from showing under the status bar icons. */}
      <View pointerEvents="none" style={[styles.statusScrim, { height: insets.top }]} />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  statusScrim: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.topTint, zIndex: 100 },
}));
