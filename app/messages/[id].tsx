import { Stack, useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '../../src/features/messages';

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatScreen groupId={String(id)} />
    </>
  );
}
