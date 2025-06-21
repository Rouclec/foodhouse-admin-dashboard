import React, { useContext, useEffect, useState } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from "react-native";
import {
  Appbar,
  Text,
  Button,
  Dialog,
  Portal,
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
import { defaultStyles, receiptStyles as styles } from "@/styles";
import { Chase } from "react-native-animated-spinkit";
import { formatAmount } from "@/utils/amountFormater";
import { generateDispatchFormPdf } from "@/components";



export default function Receipt() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [editablePhone, setEditablePhone] = useState("");

  // Helper to get string from string|string[]|undefined safely
  function asString(value?: string | string[]): string {
    if (Array.isArray(value)) return value[0] ?? "";
    return value ?? "";
  }

  // Read params safely as strings
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
      alert("Failed to dispatch order. Please check your network and try again.");
    },
  });

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
      await generateReceiptPdf({
        orderNumber: orderDetails?.order?.orderNumber || orderNumberStr,
        product:
          productData?.product?.name || productNameStr || "Unknown Product",
        quantity: quantityStr || orderDetails?.order?.quantity?.toString() || "0",
        amount:
          (currencyStr ? `${currencyStr} ` : "") +
          formatAmount(
            amountStr || orderDetails?.order?.price?.value?.toString() || "0",
            { decimalPlaces: 2 }
          ),
        address:
          deliveryAddressStr ||
          orderDetails?.order?.deliveryLocation?.address ||
          "No Address",
        sellerName:
          seller?.user?.firstName && seller?.user?.lastName
            ? `${seller.user.firstName} ${seller.user.lastName}`
            : sellerNameStr,
        sellerPhone: seller?.user?.phoneNumber || sellerphoneNumberStr || "",
        buyerName:
          buyer?.user?.firstName && buyer?.user?.lastName
            ? `${buyer.user.firstName} ${buyer.user.lastName}`
            : buyerNameStr,
        buyerPhone: buyer?.user?.phoneNumber || "",
      });
    } catch (error) {
      console.error("Error generating receipt PDF:", error);
      alert("Failed to generate receipt PDF.");
    }
  };

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
      <Appbar.Header style={defaultStyles.appHeader}>
        <TouchableOpacity onPress={() => router.back()}>
          <Appbar.BackAction color="#000" />
        </TouchableOpacity>
        <Text variant="titleMedium" style={defaultStyles.heading}>
          Dispatch Receipt
        </Text>
        <View />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Dispatch via Transport Agency</Text>
          <Text style={styles.headerSubtitle}>
            Upload the dispatch slip provided by the transport agency.
          </Text>
        </View>

        {/* Dispatch Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Foodhouse Dispatched Form</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Order Number: {orderDetails?.order?.orderNumber || orderNumberStr}
              </Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Product: {productData?.product?.name || productNameStr}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Quantity: {quantityStr || orderDetails?.order?.quantity}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  Amount:{" "}
                  {currencyStr || orderDetails?.order?.price?.currencyIsocode}{" "}
                  {formatAmount(
                    amountStr ||
                      orderDetails?.order?.price?.value?.toString() ||
                      "0",
                    { decimalPlaces: 2 }
                  )}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Address:</Text>
                <Text style={styles.detailValue}>
                  {deliveryAddressStr ||
                    orderDetails?.order?.deliveryLocation?.address ||
                    " "}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Name:{" "}
                {seller?.user?.firstName && seller?.user?.lastName
                  ? `${seller.user.firstName} ${seller.user.lastName}`
                  : sellerNameStr || " "}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Phone: {seller?.user?.phoneNumber || sellerphoneNumberStr || " "}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Name:{" "}
                {buyer?.user?.firstName && buyer?.user?.lastName
                  ? `${buyer.user.firstName} ${buyer.user.lastName}`
                  : buyerNameStr || " "}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Phone: {buyer?.user?.phoneNumber || " "}
              </Text>
            </View>
          </View>
        </View>

        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            style={[defaultStyles.button, defaultStyles.primaryButton]}
            labelStyle={styles.uploadButtonText}
          >
            Confirm Dispatch Slip
          </Button>
{/* 
          <Button
            mode="contained"
            onPress={handleGenerateReceipt}
            style={[defaultStyles.button, { marginTop: 12 }]}
          >
            Download Receipt
          </Button> */}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Edit Seller Phone</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={editablePhone}
              onChangeText={setEditablePhone}
              style={{ borderBottomWidth: 1, padding: 8 }}
              keyboardType="phone-pad"
            />
            <Button
              onPress={handleConfirmDispatch}
              mode="contained"
              style={{ marginTop: 20 }}
            >
              Confirm Dispatch
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={successModalVisible}
          onDismiss={() => setSuccessModalVisible(false)}
        >
          <Dialog.Content>
            <Image
              source={require("@/assets/images/success.png")}
              style={defaultStyles.successImage}
            />
            <Text variant="titleLarge" style={defaultStyles.primaryText}>
              Dispatch Completed
            </Text>
            <Text style={defaultStyles.bodyText}>
              Download the dispatch receipt below.
            </Text>
            {/* Optionally, you can put a button here to download or share the receipt again */}
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}
function generateReceiptPdf(arg0: { orderNumber: any; product: any; quantity: any; amount: string; address: any; sellerName: string; sellerPhone: any; buyerName: string; buyerPhone: any; }) {
  throw new Error("Function not implemented.");
}

