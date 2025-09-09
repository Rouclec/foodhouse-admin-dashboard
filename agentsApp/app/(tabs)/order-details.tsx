import React, { useContext, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Icon, Snackbar, Text } from "react-native-paper";
import { defaultStyles, orderDetailsStyles as styles } from "@/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Context, ContextType } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import { ordersGetOrderDetailsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import i18n from "@/i18n";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";
import { formatAmount } from "@/utils/amountFormater";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";

export default function OrderDetails() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;
  const { orderNumber } = useLocalSearchParams();
  const [error, setError] = useState<string>();

  const {
    data: orderDetails,
    isLoading: isOrderDetailsLoading,
    isError: errorLoadingOrder,
  } = useQuery({
    ...ordersGetOrderDetailsOptions({
      path: {
        userId: user?.userId ?? "",
        orderNumber: (orderNumber as string) ?? "",
      },
    }),
    enabled: !!orderNumber,
  });

  const { data: productData } = useQuery({
    ...productsGetProductOptions({
      path: { productId: orderDetails?.order?.product ?? "" },
    }),
    enabled: !!orderDetails?.order?.product,
  });

  const { data: buyer, isLoading: isBuyerLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: { userId: orderDetails?.order?.createdBy ?? "" },
    }),
    enabled: !!orderDetails?.order?.createdBy,
  });

  const { data: seller, isLoading: isSellerLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: { userId: orderDetails?.order?.productOwner ?? "" },
    }),
    enabled: !!orderDetails?.order?.productOwner,
  });

  const handleViewReceipt = () => {
    router.push({
      pathname: "/receipt",
      params: {
        orderNumber: orderNumber as string,
        amount: orderDetails?.order?.price?.value,
        currency: orderDetails?.order?.price?.currencyIsoCode,
        quantity: orderDetails?.order?.quantity,
        deliveryAddress: orderDetails?.order?.deliveryLocation?.address,
        productName: productData?.product?.name,
        productImage: productData?.product?.image,
        sellerName: seller?.user
          ? `${seller.user.firstName} ${seller.user.lastName}`
          : "",
        sellerphoneNumber: seller?.user?.phoneNumber,
        buyerName: buyer?.user
          ? `${buyer.user.firstName} ${buyer.user.lastName}`
          : "",
      },
    });
  };

  const handleNavigateToProduct = () => {
    if (productData?.product?.id) {
      router.push({
        pathname: "/product-details",
        params: { productId: productData.product.id },
      });
    }
  };

  if (isOrderDetailsLoading || isSellerLoading) {
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
            <View
              style={[defaultStyles.center, defaultStyles.notFoundContainer]}
            >
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
            <View
              style={[defaultStyles.center, defaultStyles.notFoundContainer]}
            >
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

          <TouchableOpacity
            onPress={handleNavigateToProduct}
            activeOpacity={0.85}
            style={defaultStyles.card}
          >
            <Image
              source={{ uri: productData?.product?.image }}
              style={styles.productImage}
            />
            <View style={styles.orderDetailsContainer}>
              <Text style={styles.leftText}>
                {i18n.t("(farmer).order-details.orderNumber")}:{" "}
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.orderNumber}
                </Text>
              </Text>
              <Text variant="titleMedium">{productData?.product?.name}</Text>
              <View style={styles.centerRow}>
                <Text variant="titleSmall" style={styles.primaryText}>
                  {orderDetails?.order?.price?.currencyIsoCode}{" "}
                  {formatAmount(
                    (
                      (productData?.product?.amount?.value ?? 0) *
                      parseInt(orderDetails?.order?.quantity ?? "")
                    ).toString() ?? "",
                    { decimalPlaces: 2 }
                  )}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

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
                  {buyer?.user
                    ? `${buyer.user.firstName} ${buyer.user.lastName}`
                    : " "}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.quantity")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {formatAmount(orderDetails?.order?.quantity ?? "")}{" "}
                  {(productData?.product?.unitType ?? "").replace("per_", "")}
                  {(parseInt(orderDetails?.order?.quantity ?? "") ?? 0) > 1 &&
                    "s"}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  Created Date
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {new Date(
                    orderDetails?.order?.createdAt ?? ""
                  ).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.listItem}>
                <Text variant="titleSmall" style={styles.leftText}>
                  {i18n.t("(farmer).order-details.deliveryAddress")}
                </Text>
                <Text variant="titleMedium" style={styles.rightText}>
                  {orderDetails?.order?.deliveryLocation?.address ?? ""}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomContainerWithContent}>
        <Button style={defaultStyles.primaryButton} onPress={handleViewReceipt}>
          <Text style={defaultStyles.buttonText}>Continue</Text>
        </Button>
      </View>

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
