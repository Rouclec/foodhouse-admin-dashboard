import { Stack } from "expo-router";
import React from "react";

export default function OrderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="select-pickup-point"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="delivery-address" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
    </Stack>
  );
}
