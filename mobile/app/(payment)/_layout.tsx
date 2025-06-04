import { Stack } from "expo-router";
import React from "react";

export default function paymentFlow() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      <Stack.Screen name="payment-account" options={{ headerShown: false }} />
    </Stack>
  );
}