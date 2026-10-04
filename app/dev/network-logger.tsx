import { Stack } from 'expo-router';
import { View } from 'react-native';
import NetworkLogger from 'react-native-network-logger';
import { ScreenBackground } from '../../src/components/ui/Screen';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';

export default function NetworkLoggerRoute() {
  return (
    <ScreenBackground>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader title="Network Logger" back />
      <View style={{ flex: 1 }}>
        <NetworkLogger theme="dark" />
      </View>
    </ScreenBackground>
  );
}
