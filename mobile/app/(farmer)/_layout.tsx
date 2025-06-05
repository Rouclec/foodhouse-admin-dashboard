import { Stack } from "expo-router";
import React from "react";

export default function FarmerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(index)">
      <Stack.Screen name="(index)" options={{ headerShown: false }} />
      <Stack.Screen name="create-product" options={{ headerShown: false }} />
      <Stack.Screen name="order-details" options={{ headerShown: false }} />
    </Stack>
  );
}
