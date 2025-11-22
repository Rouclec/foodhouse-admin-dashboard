import { Stack } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          paddingBottom: insets.bottom,
        },
      }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signin-verify-otp" options={{ headerShown: false }} />
    </Stack>
  );
}
