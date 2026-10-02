import { Stack } from 'expo-router';
import { MembersScreen } from '../src/features/members';

export default function MembersRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <MembersScreen />
    </>
  );
}
