import React, { useContext, useEffect, useState } from "react";
import {
  FlatList,
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
} from "react-native-paper";
import {
  defaultStyles,
  signupStyles,
  orderDetailsStyles as styles,
} from "@/styles";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Context, ContextType } from "../_layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ordersDispatchOrderMutation,
  ordersGetOrderDetailsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import i18n from "@/i18n";
import { Chase } from "react-native-animated-spinkit";
import { CAMEROON, Colors, countries } from "@/constants";
import { formatCurrency } from "@/utils/amountFormater";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { delay } from "@/utils";
import parsePhoneNumberFromString from "libphonenumber-js";
import PhoneNumberInput from "@/components/general/PhoneNumberInput";

export default function OrderDetails() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;
  const { orderNumber } = useLocalSearchParams();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [callingCode, setCallingCode] = useState("237");
  const [mobile, setMobile] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editablePhone, setEditablePhone] = useState("");
  const [successModalVisible, setSuccessModalVisible] = useState(false);

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

  // const handleViewReceipt = () => {
  //   router.push({
  //     pathname: "/receipt",
  //     params: {
  //       orderNumber: orderNumber as string,
  //       amount: orderDetails?.order?.price?.value,
  //       currency: orderDetails?.order?.price?.currencyIsoCode,
  //       quantity: orderDetails?.order?.quantity,
  //       deliveryAddress: orderDetails?.order?.deliveryLocation?.address,
  //       productName: productData?.product?.name,
  //       productImage: productData?.product?.image,
  //       sellerName: seller?.user
  //         ? `${seller.user.firstName} ${seller.user.lastName}`
  //         : "",
  //       sellerphoneNumber: seller?.user?.phoneNumber,
  //       buyerName: buyer?.user
  //         ? `${buyer.user.firstName} ${buyer.user.lastName}`
  //         : "",
  //     },
  //   });
  // };

  const handleContinue = async () => {
    const status = orderDetails?.order?.status;

    if (
      status === "OrderStatus_DELIVERED" ||
      status === "OrderStatus_IN_TRANSIT"
    ) {
      setError(
        `This orders has already been dispatched.\nOrder status: ${status
          .replace("OrderStatus_", "")
          .split("_")
          .join(" ")}`
      );
      await delay(5000);
      setError(undefined);
      return;
    }

    if (
      status === "OrderStatus_CREATED" ||
      status === "OrderStatus_PAYMENT_FAILED" ||
      status === "OrderStatus_REJECTED"
    ) {
      setError(
        `This order is not in a status to be dispatched\nOrder status: ${status
          .replace("OrderStatus_", "")
          .split("_")
          .join(" ")}`
      );
      await delay(5000);
      setError(undefined);
      return;
    }

    if (status === "OrderStatus_APPROVED") {
      setModalVisible(true);
      return;
    }

    setError("Order status is unknown or invalid for dispatch.");
    await delay(5000);
    setError(undefined);
  };

  const handleConfirmDispatch = async () => {
    if (!orderDetails?.order?.orderNumber || !user?.userId) {
      alert("Order details or user info missing.");
      console.warn("Missing orderNumber or userId", {
        orderNumber: orderDetails?.order?.orderNumber,
        userId: user?.userId,
      });
      return;
    }

    try {
      setLoading(true);
      await dispatchOrder({
        path: {
          orderNumber: orderDetails.order.orderNumber,
          userId: user.userId,
        },
        body: {
          payoutPhoneNumber: `${callingCode}${mobile}`,
        },
      });
    } catch (e) {
      console.error("Dispatch failed (caught in try/catch):", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToProduct = (productId: string) => {
    router.push({
      pathname: "/product-details",
      params: { productId: productId },
    });
  };

  useEffect(() => {
    if (seller?.user?.phoneNumber) {
      const country =
        countries?.find(
          (country) =>
            parsePhoneNumberFromString(
              (seller?.user?.phoneNumber ?? "") as string
            )?.countryCallingCode === country?.dial_code
        ) || CAMEROON;

      setCallingCode(country.dial_code);
      setMobile(
        parsePhoneNumberFromString((seller?.user?.phoneNumber ?? "") as string)
          ?.nationalNumber ?? ""
      );
      setEditablePhone(seller?.user?.phoneNumber);
    }
  }, [seller?.user?.phoneNumber]);

  const { mutateAsync: dispatchOrder } = useMutation({
    ...ordersDispatchOrderMutation(),
    onSuccess: async () => {
      setModalVisible(false);
      setSuccessModalVisible(true);
      router.replace("/(tabs)/(index)");
    },
    onError: (error: any) => {
      if (error?.response) {
        console.error("Error response data:", error.response.data);
      } else if (error?.message) {
        console.error("Error message:", error.message);
      }
      alert(
        "Failed to dispatch order. Please check your network and try again."
      );
    },
  });

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

          {/* TOP SECTION — 60% height */}
          <View style={{ flex: 0.6, overflow: "hidden" }}>
            <FlatList
              data={orderDetails?.order?.orderItems ?? []}
              keyExtractor={(_item, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={[defaultStyles.card, { marginBottom: 16 }]}>
                  {/* Product Image */}
                  <Image
                    source={{ uri: item?.productImage }}
                    style={styles.productImage}
                  />

                  {/* Product Details */}
                  <TouchableOpacity
                    style={styles.orderDetailsContainer}
                    onPress={() =>
                      handleNavigateToProduct(item?.productId ?? "")
                    }
                  >
                    <Text style={styles.leftText}>
                      {i18n.t("(buyer).track-order.orderNumber")}:{" "}
                      <Text variant="titleMedium" style={styles.rightText}>
                        {orderDetails?.order?.orderNumber}
                      </Text>
                    </Text>

                    <Text variant="titleSmall" style={defaultStyles.text16}>
                      {item.productName}
                    </Text>

                    <Text variant="titleSmall" style={defaultStyles.text14}>
                      {item.quantity} {item.unitType?.replace("per_", "")}
                      {parseInt(item?.quantity ?? "0") > 1 && "s"}
                    </Text>

                    <View style={styles.centerRow}>
                      <Text variant="titleSmall" style={styles.primaryText}>
                        {formatCurrency(
                          (
                            Number(item?.productUnitPrice?.value ?? 0) +
                            Number(orderDetails?.order?.deliveryFee?.value ?? 0)
                          ).toFixed(2),
                          orderDetails?.order?.sumTotal?.currencyIsoCode ?? ""
                        )}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
          <View style={{ flex: 0.4 }}>
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
        </View>
      </KeyboardAvoidingView>

      <View style={defaultStyles.bottomContainerWithContent}>
        <Button
          style={
            loading ? defaultStyles.greyButton : defaultStyles.primaryButton
          }
          // onPress={handleViewReceipt}
          // TODO: Temporal - Update later
          onPress={handleContinue}
          loading={loading}
        >
          <Text style={defaultStyles.buttonText}>Approve</Text>
        </Button>
      </View>

      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          style={styles.dialogContainer}
        >
          <Dialog.Content>
            <Text variant="titleLarge" style={styles.primaryText}>
              Confirm Phone Number
            </Text>
            <Dialog.Content>
              <Text style={defaultStyles.bodyText}>
                Confirm the farmer's preferred payment number
              </Text>
            </Dialog.Content>
          </Dialog.Content>
          <Dialog.Content>
            <PhoneNumberInput
              setCountryCode={setCallingCode}
              countryCode={callingCode}
              setPhoneNumber={setMobile}
              phoneNumber={mobile}
              containerStyle={signupStyles.phoneNumberInputContainerStyle}
            />
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={handleConfirmDispatch}
              mode="contained"
              style={[defaultStyles.button, defaultStyles.primaryButton]}
              loading={loading}
              labelStyle={styles.uploadButtonText}
            >
              Confirm Phone Number
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
