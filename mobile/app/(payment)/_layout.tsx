import { Stack } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function paymentFlow() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          paddingBottom: insets.bottom,
        },
      }}
      initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen name="payment-account" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
    </Stack>
  );
}
