import { Stack } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FarmerLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="(index)">
      <Stack.Screen name="(index)" options={{ headerShown: false }} />
      <Stack.Screen name="create-product" options={{ headerShown: false }} />
      
      <Stack.Screen name="contact-us" options={{ headerShown: false }} />
      <Stack.Screen name="personal-info" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="language" options={{ headerShown: false }} />

      <Stack.Screen name="order-details" options={{ headerShown: false }} />
    </Stack>
  );
}
