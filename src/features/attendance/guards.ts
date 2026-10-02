import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

/** Runs `then` immediately, or after the user confirms discarding unsaved changes. */
export function confirmDiscard(dirty: boolean, then: () => void): void {
  if (!dirty) {
    then();
    return;
  }
  Alert.alert('Discard changes?', 'You have unsaved attendance changes. They will be lost.', [
    { text: 'Keep editing', style: 'cancel' },
    { text: 'Discard', style: 'destructive', onPress: then },
  ]);
}

export function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
