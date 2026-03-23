import React from "react";
import { Tabs } from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { tabStyles as styles } from "@/styles";
import { Colors } from "@/constants";
import i18n from "@/i18n";

export default function AgentTabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: [
          styles.tabBar,
          {
            paddingBottom:
              Platform.OS === "ios" ? insets.bottom + 24 : insets.bottom + 48,
          },
        ],
      }}
      initialRouteName="index"
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Icon
                source={focused ? "view-dashboard" : "view-dashboard-outline"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                Dashboard
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Icon
                source={focused ? "account-circle" : "account-circle-outline"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
