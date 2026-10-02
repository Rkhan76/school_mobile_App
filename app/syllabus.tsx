import { Stack } from 'expo-router';
import { SyllabusScreen } from '../src/features/syllabus';

export default function SyllabusRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SyllabusScreen />
    </>
  );
}
