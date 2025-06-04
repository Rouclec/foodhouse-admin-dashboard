import {
  ordersGetOrderDetailsOptions,
  ordersListUserOrdersOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import i18n from "@/i18n";
import { defaultStyles } from "@/styles";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Icon, Text } from "react-native-paper";
import { Context, ContextType } from "../_layout";

export default function TrackOrder() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const { orderNumber } = useLocalSearchParams();

  const { data, isLoading } = useQuery({
    ...ordersGetOrderDetailsOptions({
      path: {
        userId: user?.userId ?? "",
        orderNumber: (orderNumber as string) ?? "",
      },
    }),
    enabled: !!orderNumber,
  });

  console.log({ data }, "order details");

  return (
    <>
      <KeyboardAvoidingView
        style={defaultStyles.container}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      >
        <View style={defaultStyles.flex}>
          <Appbar.Header dark={false} style={defaultStyles.appHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} />
            </TouchableOpacity>
            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t("(buyer).track-order.trackOrder")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={defaultStyles.flex}></View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
