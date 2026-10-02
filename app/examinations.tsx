import { Stack } from 'expo-router';
import { ExamsScreen } from '../src/features/examinations';

export default function ExaminationsRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ExamsScreen />
    </>
  );
}
