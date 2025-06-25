import React, { useContext, useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import {
  Appbar,
  Text,
  Button,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
  Icon,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Context, ContextType } from "../_layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ordersDispatchOrderMutation,
  ordersGetOrderDetailsOptions,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { defaultStyles, loginstyles, receiptStyles as styles } from "@/styles";
import { Chase } from "react-native-animated-spinkit";
import { formatAmount } from "@/utils/amountFormater";
import { generateDispatchFormPdf } from "@/components";
import i18n from "@/i18n";
import { Colors } from "@/constants";
import parsePhoneNumberFromString from "libphonenumber-js";

export default function Receipt() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [editablePhone, setEditablePhone] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const FOODHOUSE_PHONE = process.env.EXPO_PUBLIC_PHONE_NUMBER;
  const FOODHOUSE_EMAIL = process.env.EXPO_PUBLIC_EMAIL;

  // Helper to get string from string|string[]|undefined safely
  function asString(value?: string | string[]): string {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
  }

  const {
    orderNumber,
    productName,
    sellerphoneNumber,
    sellerName,
    buyerName,
    amount,
    currency,
    quantity,
    deliveryAddress,
  } = useLocalSearchParams();

  // Safe string values
  const orderNumberStr = asString(orderNumber);
  const productNameStr = asString(productName);
  const sellerphoneNumberStr = asString(sellerphoneNumber);
  const sellerNameStr = asString(sellerName);
  const buyerNameStr = asString(buyerName);
  const amountStr = asString(amount);
  const currencyStr = asString(currency);
  const quantityStr = asString(quantity);
  const deliveryAddressStr = asString(deliveryAddress);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [messageModalText, setMessageModalText] = useState("");

  const {
    data: orderDetails,
    isLoading,
    isError,
  } = useQuery({
    ...ordersGetOrderDetailsOptions({
      path: {
        userId: user?.userId ?? "",
        orderNumber: orderNumberStr,
      },
    }),
    enabled: !!orderNumberStr,
  });

  const { data: buyer } = useQuery({
    ...usersGetUserByIdOptions({
      path: { userId: orderDetails?.order?.createdBy ?? "" },
    }),
    enabled: !!orderDetails?.order?.createdBy,
  });

  const { data: seller } = useQuery({
    ...usersGetUserByIdOptions({
      path: { userId: orderDetails?.order?.productOwner ?? "" },
    }),
    enabled: !!orderDetails?.order?.productOwner,
  });

  const { data: productData } = useQuery({
    ...productsGetProductOptions({
      path: { productId: orderDetails?.order?.product ?? "" },
    }),
    enabled: !!orderDetails?.order?.product,
  });

  useEffect(() => {
    if (seller?.user?.phoneNumber || sellerphoneNumberStr) {
      setEditablePhone(seller?.user?.phoneNumber || sellerphoneNumberStr);
    }
  }, [seller?.user?.phoneNumber, sellerphoneNumberStr]);

  const { mutateAsync: dispatchOrder } = useMutation({
    ...ordersDispatchOrderMutation(),
    onSuccess: async () => {
      console.log("Dispatch order succeeded");
      setModalVisible(false);
      setSuccessModalVisible(true);
    },
    onError: (error: any) => {
      console.error("Dispatch error", error);
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

  const handleContinue = () => {
    const status = orderDetails?.order?.status;

    if (
      status === "OrderStatus_DELIVERED" ||
      status === "OrderStatus_IN_TRANSIT"
    ) {
      setMessageModalText(
        `This orders has already been dispatched.\nOrder status: ${status
          .replace("OrderStatus_", "")
          .split("_")
          .join(" ")}`
      );
      setMessageModalVisible(true);
      return;
    }

    if (
      status === "OrderStatus_CREATED" ||
      status === "OrderStatus_PAYMENT_FAILED" ||
      status === "OrderStatus_REJECTED"
    ) {
      setMessageModalText(
        `This order is not in a status to be dispatched\nOrder status: ${status
          .replace("OrderStatus_", "")
          .split("_")
          .join(" ")}`
      );
      setMessageModalVisible(true);
      return;
    }

    if (status === "OrderStatus_APPROVED") {
      setModalVisible(true);
      return;
    }

    setMessageModalText("Order status is unknown or invalid for dispatch.");
    setMessageModalVisible(true);
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
    console.log("Dispatching order with:", {
      orderNumber: orderDetails.order.orderNumber,
      userId: user.userId,
      payoutPhoneNumber: editablePhone,
    });

    try {
      await dispatchOrder({
        path: {
          orderNumber: orderDetails.order.orderNumber,
          userId: user.userId,
        },
        body: {
          payoutPhoneNumber: editablePhone,
        },
      });
    } catch (e) {
      console.error("Dispatch failed (caught in try/catch):", e);
    }
  };

  const handleGenerateReceipt = async () => {
    try {
      setLoading(true);
      await generateDispatchFormPdf({
        orderId: orderDetails?.order?.orderNumber || orderNumberStr,
        quantity:
          quantityStr || orderDetails?.order?.quantity?.toString() || "0",
        deliveryLocation:
          deliveryAddressStr ||
          orderDetails?.order?.deliveryLocation?.address ||
          "No Address",
        farmerName:
          seller?.user?.firstName && seller?.user?.lastName
            ? `${seller.user.firstName} ${seller.user.lastName}`
            : sellerNameStr || "Unknown Farmer",
        farmerAddress: seller?.user?.address || "Unknown Address",
        farmerPhone: seller?.user?.phoneNumber || sellerphoneNumberStr || "",
        buyerName:
          buyer?.user?.firstName && buyer?.user?.lastName
            ? `${buyer.user.firstName} ${buyer.user.lastName}`
            : buyerNameStr || "Unknown Buyer",
        buyerPhone: buyer?.user?.phoneNumber || "",
        agentName:
          user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : "Unknown Agent",
        agentPhone: user?.phoneNumber || "",
        unit: `${productData?.product?.unitType?.replace("per_", "").trim()}${
          parseInt(quantityStr) > 1 ? "s" : ""
        }`,
      });
    } catch (error) {
      console.error("Error generating receipt PDF:", error);
      alert("Failed to generate receipt PDF.");
    } finally {
      setLoading(false);
    }
  };

  console.log(
    "s string: ",
    parseInt(quantityStr),
    `${parseInt(quantityStr) > 1 ? "s" : ""}`
  );
  if (isLoading) {
    return (
      <View style={defaultStyles.container}>
        <Chase size={56} color="#2e7d32" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={defaultStyles.container}>
        <Text>Could not load receipt details</Text>
      </View>
    );
  }

  return (
    <View style={defaultStyles.container}>
      <Appbar.Header dark={false} style={defaultStyles.appHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={defaultStyles.backButtonContainer}
        >
          <Icon source={"arrow-left"} size={24} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={defaultStyles.heading}>
          Dispatch Info
        </Text>
        <View />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={defaultStyles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          {snackbarVisible && (
            <View style={styles.snackbarContainer}>
              <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            </View>
          )}
          <View style={styles.header}>
            <View style={styles.logocircle}>
              <Text style={styles.Logotext}>Food{"\n"}House</Text>
            </View>
            <Text style={styles.formTitle}>Foodhouse Dispatched Form</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Order Number: </Text>
                <Text style={styles.infoValue}>
                  #{orderDetails?.order?.orderNumber || orderNumberStr}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Quantity: </Text>
                <Text variant="titleMedium" style={styles.infoValue}>
                  {formatAmount(orderDetails?.order?.quantity ?? "")}{" "}
                  {(productData?.product?.unitType ?? "").replace("per_", "")}
                  {(parseInt(orderDetails?.order?.quantity ?? "") ?? 0) > 1 &&
                    "s"}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Delivery Location: </Text>
                <Text style={styles.infoValue}>
                  {deliveryAddressStr ||
                    orderDetails?.order?.deliveryLocation?.address ||
                    " "}
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Farmer</Text>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Name: </Text>
                <Text style={styles.infoValue}>
                  {seller?.user?.firstName && seller?.user?.lastName
                    ? `${seller.user.firstName} ${seller.user.lastName}`
                    : sellerNameStr || " "}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Address: </Text>
                <Text style={styles.infoValue}>
                  {seller?.user?.address || " "}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Phone: </Text>
                <Text style={styles.infoValue}>
                  {parsePhoneNumberFromString(
                    editablePhone ||
                      seller?.user?.phoneNumber ||
                      sellerphoneNumberStr ||
                      " "
                  )?.formatInternational()}
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer</Text>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Name: </Text>
                <Text style={styles.infoValue}>
                  {buyer?.user?.firstName && buyer?.user?.lastName
                    ? `${buyer.user.firstName} ${buyer.user.lastName}`
                    : buyerNameStr || " "}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Phone: </Text>
                <Text style={styles.infoValue}>
                  {parsePhoneNumberFromString(
                    buyer?.user?.phoneNumber || " "
                  )?.formatInternational()}
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agent</Text>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Name: </Text>
                <Text style={styles.infoValue}>
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : " "}
                </Text>
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text>
                <Text style={styles.infoLabel}>Phone: </Text>
                <Text style={styles.infoValue}>
                  {parsePhoneNumberFromString(
                    user?.phoneNumber || " "
                  )?.formatInternational()}
                </Text>
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              📞{" "}
              {parsePhoneNumberFromString(
                FOODHOUSE_PHONE ?? ""
              )?.formatInternational()}
            </Text>
            <Text style={styles.footerText}>✉️ {FOODHOUSE_EMAIL}</Text>
          </View>
        </View>

        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            // onPress={handleContinue}
            onPress={handleGenerateReceipt}
            style={[defaultStyles.button, defaultStyles.primaryButton]}
            labelStyle={styles.uploadButtonText}
          >
            Continue
          </Button>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={messageModalVisible}
          onDismiss={() => setMessageModalVisible(false)}
          style={styles.dialogContainer}
        >
          <Dialog.Content>
            <Text variant="titleLarge" style={styles.primaryText}>
              Notice
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>{messageModalText}</Text>
          </Dialog.Content>
          <Dialog.Content>
            <Button
              mode="contained"
              onPress={() => setMessageModalVisible(false)}
              style={[defaultStyles.button, defaultStyles.primaryButton]}
            >
              OK
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>

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
            <TextInput
              mode="outlined"
              value={editablePhone}
              onChangeText={setEditablePhone}
              keyboardType="phone-pad"
              theme={{
                roundness: 15,
                colors: {
                  onSurfaceVariant: Colors.grey["e8"],
                  primary: Colors.primary[500],
                },
              }}
              outlineColor={Colors.grey["bg"]}
              style={[loginstyles.input, styles.inputMargin]}
            />

            <Button
              onPress={handleConfirmDispatch}
              mode="contained"
              style={[defaultStyles.button, defaultStyles.primaryButton]}
              labelStyle={styles.uploadButtonText}
            >
              Confirm Phone Number
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => setSuccessModalVisible(false)}
          style={defaultStyles.dialogSuccessContainer}
        >
          <Dialog.Content>
            <Image
              source={require("@/assets/images/success.png")}
              style={defaultStyles.successImage}
            />
          </Dialog.Content>
          <Dialog.Content>
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              {i18n.t("(auth).(subsciption-flow).account.paymentSuccessful")}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Text style={defaultStyles.bodyText}>
              {i18n.t(
                "(auth).(subsciption-flow).account.paymentCompleteMessage"
              )}
            </Text>
          </Dialog.Content>
          <Dialog.Content>
            <Button
              mode="contained"
              onPress={handleGenerateReceipt}
              loading={loading}
              disabled={loading}
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                loading && defaultStyles.greyButton,
              ]}
            >
              <Text style={defaultStyles.buttonText}>Download Receipt</Text>
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}
