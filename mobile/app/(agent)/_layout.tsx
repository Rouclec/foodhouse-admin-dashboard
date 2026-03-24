import { Stack } from 'expo-router';
import React from 'react';

export default function AgentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="(index)">
      <Stack.Screen name="(index)" options={{ headerShown: false }} />
      <Stack.Screen name="kyc" options={{ headerShown: false }} />
      <Stack.Screen name="order-details" options={{ headerShown: false }} />
    </Stack>
  );
}
