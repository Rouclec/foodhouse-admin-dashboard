import React from "react";
import { Tabs } from "expo-router";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, SafeAreaView, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { tabStyles as styles } from "@/styles";
import { Colors } from "@/constants";
import { FontAwesome5, FontAwesome6, Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n";

export default function TabLayout() {
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
                source={focused ? "home-variant" : "home-variant-outline"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                {i18n.t("(buyer).(index)._layout.home")}
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Icon
                source={focused ? "cart" : "cart-outline"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                {i18n.t("(buyer).(index)._layout.orders")}
              </Text>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="farmers"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Icon
                source={"account-hard-hat"}
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                {i18n.t("(buyer).(index)._layout.farmers")}
              </Text>
            </View>
          ),
        }}
      />

      {/* <Tabs.Screen
        name="system-chat"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons
                name={
                  focused
                    ? "chatbubble-ellipses"
                    : "chatbubble-ellipses-outline"
                }
                size={24}
                color={focused ? Colors.primary[500] : Colors.grey["9e"]}
              />
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                System Chat
              </Text>
            </View>
          ),
        }}
      /> */}
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
              <Text style={[styles.tabItemText, focused && styles.focusedText]}>
                {i18n.t("(buyer).(index)._layout.profile")}
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
