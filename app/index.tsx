import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { colors } from '../src/theme/tokens';
import { useSession } from '../src/features/auth/session';

export default function Index() {
  const status = useSession((s) => s.status);
  const didBootstrap = useRef(false);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    useSession.getState().bootstrap();
  }, []);

  if (status === 'authed') {
    return <Redirect href="/(tabs)" />;
  }

  if (status === 'unauthed') {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
