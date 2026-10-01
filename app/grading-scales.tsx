import { Stack } from 'expo-router';
import { GradingScalesScreen } from '../src/features/grading-scales';

export default function GradingScalesRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <GradingScalesScreen />
    </>
  );
}
