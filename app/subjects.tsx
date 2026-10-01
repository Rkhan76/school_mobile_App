import { Stack } from 'expo-router';
import { SubjectsScreen } from '../src/features/subjects';

export default function SubjectsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SubjectsScreen />
    </>
  );
}
