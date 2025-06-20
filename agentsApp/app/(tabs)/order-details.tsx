import React, { useContext, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Dialog,
  Icon,
  Portal,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import { defaultStyles, orderDetailsStyles as styles } from "@/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Context, ContextType } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import { ordersGetOrderDetailsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import i18n from "@/i18n";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";
import { formatAmount } from "@/utils/amountFormater";
import { usersGetPublicUserOptions } from "@/client/users.swagger/@tanstack/react-query.gen";

export default function OrderDetails() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;
  const { orderNumber } = useLocalSearchParams();
  const [error, setError] = useState<string>();

  const {
    data: orderDetails,
    isLoading: isOrderDetailsLoading,
    isError: errorLoadingOrder,
    refetch,
  } = useQuery({
    ...ordersGetOrderDetailsOptions({
      path: {
        userId: user?.userId ?? "",
        orderNumber: (orderNumber as string) ?? "",
      },
    }),
    enabled: !!orderNumber,
  });

  const { data: buyer } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: orderDetails?.order?.createdBy ?? "",
      },
    }),
    enabled: !!orderDetails?.order?.createdBy,
  });

  if (isOrderDetailsLoading) {
    return (
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
              {i18n.t("(farmer).order-details.orderDetails")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (errorLoadingOrder) {
    return (
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
              {i18n.t("(farmer).order-details.orderDetails")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
              <Text>{i18n.t("(farmer).order-details.couldNotLoad")}</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

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
              {i18n.t("(farmer).order-details.orderDetails")}
            </Text>
            <View />
          </Appbar.Header>
          
          <View style={defaultStyles.card}>
            {orderDetails?.order?.productImage && (
              <Image
                source={{ uri: orderDetails.order.productImage }}
                style={styles.productImage}
              />
            )}
            <View style={styles.orderDetailsContainer}>
              <Text style={styles.leftText}>
                {i18n.t("(farmer).order-details.orderNumber")}:{" "}
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.orderNumber}
                </Text>
              </Text>
              <Text variant="titleMedium">{orderDetails?.order?.productName}</Text>
              <View style={styles.centerRow}>
                <Text variant="titleSmall" style={styles.primaryText}>
                  {orderDetails?.order?.price?.currencyIsoCode}{" "}
                  {formatAmount(
                    orderDetails?.order?.totalAmount?.toString() ?? "",
                    { decimalPlaces: 2 }
                  )}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[
              defaultStyles.scrollContainer,
              styles.mainContainer,
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.customersName")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {buyer?.name || "N/A"}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.quantity")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {formatAmount(orderDetails?.order?.quantity ?? "")}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.status")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.status}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.orderDate")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {new Date(orderDetails?.order?.orderDate ?? "").toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.deliveryAddress")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.deliveryAddress || "N/A"}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(undefined)}
        duration={3000}
        style={[defaultStyles.snackbar, defaultStyles.marginHorizontal24]}
      >
        <Text style={defaultStyles.errorText}>{error}</Text>
      </Snackbar>
    </>
  );
}