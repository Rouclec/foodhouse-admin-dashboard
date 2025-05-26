import { Stack } from "expo-router";
import React from "react";

export default function ForgotPassword() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="verify-otp" options={{ headerShown: false }} />
      <Stack.Screen
        name="create-new-password"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
