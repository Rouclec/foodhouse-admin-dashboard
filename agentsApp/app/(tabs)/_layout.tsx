import { Stack } from "expo-router";
import React from "react";

export default function FarmerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(index)">
      <Stack.Screen name="(index)" options={{ headerShown: false }} />
      <Stack.Screen name="order-details" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen name="contact-us" options={{ headerShown: false }} />
      <Stack.Screen name="personal-info" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="language" options={{ headerShown: false }} />
      <Stack.Screen name="receipt" options={{ headerShown: false }} />
       <Stack.Screen name="product-details" options={{ headerShown: false }} />
    </Stack>
  );
}
