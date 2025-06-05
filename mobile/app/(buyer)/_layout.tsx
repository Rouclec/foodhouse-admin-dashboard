import { Stack } from "expo-router";
import React from "react";

export default function BuyerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(index)">
      <Stack.Screen name="(index)" options={{ headerShown: false }} />
      <Stack.Screen name="product-details" options={{ headerShown: false }} />
      <Stack.Screen name="(order)" options={{ headerShown: false }} />
      <Stack.Screen name="track-order" options={{ headerShown: false }} />
    </Stack>
  );
}
