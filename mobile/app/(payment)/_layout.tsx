import { Stack } from "expo-router";
import React from "react";

export default function Payment() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="paymentAccount" options={{ headerShown: false }} />
    </Stack>
  );
}