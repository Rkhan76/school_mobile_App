import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme/tokens';

/** Pulsing placeholder rows shown while the timetable loads. */
export function TimetableSkeleton() {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.wrap, { opacity }]} accessibilityLabel="Loading timetable">
      {Array.from({ length: 6 }, (_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.left}>
            <View style={[styles.bar, { width: 56 }]} />
            <View style={[styles.bar, { width: 44, height: 9 }]} />
          </View>
          <View style={styles.right}>
            <View style={[styles.bar, { width: '60%', height: 14 }]} />
            <View style={[styles.bar, { width: '40%' }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  card: {
    flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.cardSolid,
    borderWidth: 1, borderColor: colors.border,
  },
  left: { width: 76, gap: 6 },
  right: { flex: 1, gap: 8 },
  bar: { height: 11, borderRadius: 6, backgroundColor: colors.border },
});
