import React, { FC, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon, Text, TextInput } from "react-native-paper";
import { Context, ContextType } from "../../_layout";
import { defaultStyles, farmerIndexStyles as styles } from "@/styles";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { Feather } from "@expo/vector-icons";
import { ordersListFarmerOrdersOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import {
  ordersgrpcOrderStatus,
} from "@/client/orders.swagger";
import { Chase } from "react-native-animated-spinkit";
import { OrderItem } from "@/components";

const HOUR_OF_DAY = new Date().getHours();

const TAB_ITEMS: Array<{
  name: string;
  value: Array<ordersgrpcOrderStatus>;
}> = [
  {
    name: i18n.t("(farmer).(index).index.pending"),
    value: [
      "OrderStatus_PAYMENT_SUCCESSFUL",
      "OrderStatus_APPROVED",
      "OrderStatus_IN_TRANSIT",
    ],
  },
  {
    name: i18n.t("(farmer).(index).index.completed"),
    value: ["OrderStatus_DELIVERED"],
  },
];

export default function Orders() {
  const { user } = useContext(Context) as ContextType;

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.flex}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            defaultStyles.flex,
            styles.bgWhite,
            defaultStyles.relativeContainer,
          ]}
        >
          <View style={styles.appHeader}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.appHeaderContent}>
                <View style={styles.appHeaderTopContainer}>
                  <View style={styles.appHeaderLeftContainer}>
                    <View style={styles.iconContainer}>
                      <Image
                        source={require("@/assets/images/carrots.png")}
                        tintColor={Colors.primary[500]}
                      />
                    </View>
                    <View>
                      <Text style={styles.greetingsText} variant="bodyLarge">
                        {HOUR_OF_DAY < 12
                          ? i18n.t("(farmer).(index).index.goodMorning")
                          : HOUR_OF_DAY < 17
                          ? i18n.t("(farmer).(index).index.goodAfternoon")
                          : i18n.t("(farmer).(index).index.goodEvening")}{" "}
                        👋
                      </Text>
                      <Text style={styles.nameText} variant="titleLarge">
                        {user?.firstName} {user?.lastName}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.iconContainer}>
                    <View style={defaultStyles.relativeContainer}>
                      <Icon
                        source={"bell-outline"}
                        size={24}
                        color={Colors.dark[10]}
                      />
                      <View style={styles.noticiatonIndicator} />
                    </View>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder={i18n.t("(farmer).(index).index.searchOrder")}
                  placeholderTextColor={Colors.grey["bd"]}
                  style={[defaultStyles.input, styles.searchInput]}
                  outlineStyle={styles.searchInputOutline}
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon={() => (
                        <Feather
                          name="search"
                          size={20}
                          color={Colors.grey["bd"]}
                        />
                      )}
                      size={24}
                      color={Colors.grey["61"]}
                    />
                  }
                  theme={{
                    colors: {
                      primary: Colors.primary[500],
                      background: Colors.grey["fa"],
                      error: Colors.error,
                    },
                    roundness: 16,
                  }}
                />
              </View>
            </SafeAreaView>
          </View>
          
          {/* Only showing a single button in the body */}
          <View style={[defaultStyles.container, defaultStyles.center]}>
            <TouchableOpacity 
              style={[defaultStyles.button, {paddingHorizontal: 20, paddingVertical: 10}]}
            >
              <Text style={defaultStyles.buttonText}>Get Order Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}