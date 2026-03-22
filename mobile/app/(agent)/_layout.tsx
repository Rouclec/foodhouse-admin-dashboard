import { Stack } from 'expo-router';
import React from 'react';
import { AgentProvider } from '@/contexts/AgentContext';

function AgentLayoutContent() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="(index)">
      <Stack.Screen name="demo-entry" options={{ headerShown: false }} />
      <Stack.Screen name="(index)" options={{ headerShown: false }} />
      <Stack.Screen name="(kyc)" options={{ headerShown: false }} />
      <Stack.Screen name="order-details" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function AgentLayout() {
  return (
    <AgentProvider>
      <AgentLayoutContent />
    </AgentProvider>
  );
}
