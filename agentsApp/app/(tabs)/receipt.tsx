import React, { useContext } from "react";
import { View, ScrollView, Image, TouchableOpacity } from "react-native";
import { Appbar, Text, Button } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Context, ContextType } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import { ordersGetOrderDetailsOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { defaultStyles, receiptStyles as styles } from "@/styles";
import { Chase } from "react-native-animated-spinkit";
import { usersGetPublicUserOptions } from "@/client/users.swagger/@tanstack/react-query.gen";
import { formatAmount } from "@/utils/amountFormater";

export default function Receipt() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;
  const { 
    orderNumber,
    productName,
    productImage,
    sellerName,
    buyerName,
    amount,
    currency,
    quantity,
    deliveryAddress
  } = useLocalSearchParams();

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

  // Fetch buyer details
  const { data: buyer } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: orderDetails?.order?.createdBy ?? "",
      },
    }),
    enabled: !!orderDetails?.order?.createdBy,
  });

  // Fetch seller details
  const { data: seller } = useQuery({
    ...usersGetPublicUserOptions({
      path: {
        userId: orderDetails?.order?.productOwner ?? "",
      },
    }),
    enabled: !!orderDetails?.order?.productOwner,
  });

  const handleUploadSlip = () => {
    console.log("Uploading dispatch slip...");
    // Add your actual upload logic here
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
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Dispatch via Transport Agency</Text>
          <Text style={styles.headerSubtitle}>
            Upload the dispatch slip provided by the transport agency. Once submitted, the order will be marked as dispatched.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Foodhouse Dispatched Form</Text>

          {/* Order Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Details</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Order Number: {orderDetails?.order?.orderNumber || orderNumber}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Product:</Text>
                <Text style={styles.detailValue}>{productName || orderDetails?.order?.product}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity:</Text>
                <Text style={styles.detailValue}>{quantity || orderDetails?.order?.quantity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount:</Text>
                <Text style={styles.detailValue}>
                  {currency || orderDetails?.order?.price?.currencyIsocode} {formatAmount(
                    amount || orderDetails?.order?.price?.value?.toString() || "0",
                    { decimalPlaces: 2 }
                  )}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Delivery Address:</Text>
                <Text style={styles.detailValue}>
                  {deliveryAddress || orderDetails?.order?.deliveryLocation?.address || "N/A"}
                </Text>
              </View>
            </View>
          </View>

          {/* Seller Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{sellerName || seller?.name || ''}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{seller?.phone || ''}</Text>
              </View>
            </View>
          </View>

          {/* Buyer Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buyer</Text>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{buyerName || buyer?.name || 'N/A'}</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <Text style={styles.detailValue}>{buyer?.phoneNumber || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.uploadSection}>
          <Button
            mode="contained"
            onPress={handleUploadSlip}
            style={styles.uploadButton}
            labelStyle={styles.uploadButtonText}
          >
            Upload Dispatch Slip
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}