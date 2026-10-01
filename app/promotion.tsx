import { Stack } from 'expo-router';
import { PromotionScreen } from '../src/features/promotion';

export default function PromotionRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <PromotionScreen />
    </>
  );
}
