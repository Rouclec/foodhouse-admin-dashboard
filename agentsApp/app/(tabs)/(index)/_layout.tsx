import React from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { FontAwesome5 } from "@expo/vector-icons";

import { tabStyles as styles } from "@/styles";
import { Colors } from "@/constants";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="index"
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
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Icon
                source={focused ? "cart" : "cart-outline"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text
                style={[styles.tabItemText, focused && styles.focusedText]}
              >
                Home
              </Text>
            </View>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <FontAwesome5
                name={focused ? "user-alt" : "user"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text
                style={[styles.tabItemText, focused && styles.focusedText]}
              >
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
