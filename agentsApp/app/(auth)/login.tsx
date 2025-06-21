import React, { useContext, useState, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
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
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ordersGetOrderDetailsOptions,
  ordersDispatchOrderMutation,
} from "@/client/orders.swagger/@tanstack/react-query.gen";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { defaultStyles, receiptStyles as styles } from "@/styles";
import { Chase } from "react-native-animated-spinkit";
import { formatAmount } from "@/utils/amountFormater";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export default function Receipt() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;

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

  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [editablePhone, setEditablePhone] = useState("");

  const {
    data: orderDetails,
    isLoading,
    isError,
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
    if (seller?.user?.phoneNumber || sellerphoneNumber) {
      setEditablePhone(seller?.user?.phoneNumber || sellerphoneNumber);
    }
  }, [seller, sellerphoneNumber]);

  const { mutateAsync: dispatchOrder } = useMutation({
    ...ordersDispatchOrderMutation(),
    onError: (err) => {
      console.error("Dispatch error:", err);
    },
    onSuccess: () => {
      setModalVisible(false);
      setSuccessModalVisible(true);
    },
  });

  const handleUploadSlip = () => setModalVisible(true);

  const handleConfirmDispatch = async () => {
    if (!editablePhone) return;

    await dispatchOrder({
      path: {
        orderNumber: orderNumber as string,
        userId: user?.userId ?? "",
      },
      body: {
        payoutPhoneNumber: editablePhone,
      },
    });
  };

  const handleDownloadReceipt = async () => {
    try {
      const receiptUrl = `https://your-server.com/receipts/${orderDetails?.order?.orderNumber}.pdf`;
      const fileUri =
        FileSystem.documentDirectory +
        `dispatch-${orderDetails?.order?.orderNumber}.pdf`;

      const downloadResumable = FileSystem.createDownloadResumable(
        receiptUrl,
        fileUri
      );
      const { uri } = await downloadResumable.downloadAsync();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }

      setSuccessModalVisible(false);
      router.push("/(tabs)/(index)");
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  if (isLoading) {
    return (
      <View style={defaultStyles.container}>
        <Appbar.Header dark={false} style={defaultStyles.appHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={defaultStyles.backButtonContainer}
          >
            <Appbar.BackAction color="#000000" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={defaultStyles.heading}>
            Dispatch Receipt
          </Text>
          <View />
        </Appbar.Header>
        <View style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
          <Chase size={56} color="#2e7d32" />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={defaultStyles.container}>
        <Appbar.Header dark={false} style={defaultStyles.appHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={defaultStyles.backButtonContainer}
          >
            <Appbar.BackAction color="#000000" />
          </TouchableOpacity>
          <Text variant="titleMedium" style={defaultStyles.heading}>
            Dispatch Receipt
          </Text>
          <View />
        </Appbar.Header>
        <View style={[defaultStyles.center, defaultStyles.notFoundContainer]}>
          <Text>Could not load receipt details</Text>
        </View>
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
          <Appbar.BackAction color="#000000" />
        </TouchableOpacity>
        <Text variant="titleMedium" style={defaultStyles.heading}>
          Dispatch Receipt
        </Text>
        <View />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Dispatch via Transport Agency</Text>
          <Text style={styles.headerSubtitle}>
            Upload the dispatch slip provided by the transport agency. Once
            submitted, the order will be marked as dispatched.
          </Text>
        </View>

        {/* Dispatch Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Foodhouse Dispatched Form</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Order Number: {orderDetails?.order?.orderNumber || orderNumber}
              </Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product:</Text>
                <Text style={styles.detailValue}>
                  {productData?.product?.name || productName}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>
                  {quantity || orderDetails?.order?.quantity}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {currency || orderDetails?.order?.price?.currencyIsocode}{" "}
                  {formatAmount(
                    amount ||
                      orderDetails?.order?.price?.value?.toString() ||
                      "0",
                    { decimalPlaces: 2 }
                  )}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Address:</Text>
                <Text style={styles.detailValue}>
                  {deliveryAddress ||
                    orderDetails?.order?.deliveryLocation?.address ||
                    "N/A"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>
                {seller?.user?.firstName + " " + seller?.user?.lastName ||
                  sellerName ||
                  "N/A"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>
                {seller?.user?.phoneNumber || sellerphoneNumber || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>
                {buyer?.user?.firstName + " " + buyer?.user?.lastName ||
                  buyerName ||
                  "N/A"}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>
                {buyer?.user?.phoneNumber || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        <View style={defaultStyles.bottomButtonContainer}>
          <Button
            mode="contained"
            onPress={handleUploadSlip}
            style={[defaultStyles.button, defaultStyles.primaryButton]}
            labelStyle={styles.uploadButtonText}
          >
            Confirm Dispatch Slip
          </Button>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Confirm Dispatch</Dialog.Title>
          <Dialog.Content>
            <TextInput
              value={editablePhone}
              onChangeText={setEditablePhone}
              keyboardType="phone-pad"
              style={{
                borderBottomWidth: 1,
                padding: 8,
                backgroundColor: "#fff",
                color: "#000",
              }}
            />
            <Button
              onPress={handleConfirmDispatch}
              mode="contained"
              style={{ marginTop: 20 }}
              disabled={!editablePhone}
            >
              Confirm Dispatch
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>

      {/* Success Modal */}
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
            <Button
              onPress={handleDownloadReceipt}
              mode="contained"
              style={{ marginTop: 20 }}
            >
              Download Dispatch Form
            </Button>
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}
