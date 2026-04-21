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
      <Stack.Screen
        name="tpw-card-webview"
        options={{
          headerShown: false,
          // Full-bleed checkout; safe area / scroll room handled in the screen + injected CSS.
          contentStyle: { flex: 1, paddingBottom: 0 },
        }}
      />
      <Stack.Screen name="custom-package" options={{ headerShown: false }} />
      <Stack.Screen name="package-details" options={{ headerShown: false }} />
      <Stack.Screen name="select-products" options={{ headerShown: false }} />
      <Stack.Screen name="summary" options={{ headerShown: false }} />
      <Stack.Screen name="subscription-checkout" options={{ headerShown: false }} />
    </Stack>
  );
}
