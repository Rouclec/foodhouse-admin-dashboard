import React, { useContext } from "react";
import {
  Image,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Icon, Text } from "react-native-paper";
import { defaultStyles, orderDetailsStyles as styles } from "@/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Context, ContextType } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import { ordersGetOrderDetailsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import i18n from "@/i18n";
import { Chase } from "react-native-animated-spinkit";
import { Colors } from "@/constants";
import { formatAmount } from "@/utils/amountFormater";

export default function OrderDetails() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const { orderNumber } = useLocalSearchParams();

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

  const {
    isLoading: isProductLoading,
    data: productData,
    isError: errorLoadingProduct,
  } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: orderDetails?.order?.product ?? "",
      },
    }),
    enabled: !!orderDetails?.order,
  });

  if (isOrderDetailsLoading || isProductLoading) {
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
      </>
    );
  }

  if (errorLoadingOrder || errorLoadingProduct) {
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
      </>
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
            <Image
              source={{ uri: productData?.product?.image }}
              style={styles.productImage}
            />
            <View style={styles.orderDetailsContainer}>
              <Text variant="titleMedium">{productData?.product?.name}</Text>
              <View style={styles.centerRow}>
                <Text variant="titleSmall" style={styles.primaryText}>
                  {orderDetails?.order?.price?.currencyIsoCode}
                  {formatAmount(orderDetails?.order?.price?.value ?? "", {
                    decimalPlaces: 2,
                  })}
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
            <View style={defaultStyles.card}>
              <View>
                {/* <Text></Text>
                <Text></Text> */}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      {orderDetails?.order?.status === "OrderStatus_PAYMENT_SUCCESSFUL" && (
        <View style={defaultStyles.bottomButtonContainer}>
          <Button style={[defaultStyles.primaryButton]}>
            <Text style={defaultStyles.buttonText}>
              {i18n.t("(farmer).order-details.approveOrder")}
            </Text>
          </Button>
        </View>
      )}
    </>
  );
}
