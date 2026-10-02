import { Stack } from 'expo-router';
import { MessagesScreen } from '../../src/features/messages';

export default function MessagesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MessagesScreen />
    </>
  );
}
