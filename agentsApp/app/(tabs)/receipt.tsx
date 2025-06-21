import React, { useContext, useState, useRef } from "react";
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
  Icon,
  Snackbar,
  Text,
} from "react-native-paper";
import { defaultStyles, orderDetailsStyles as styles, buyerProductsStyles, profileFlowStyles } from "@/styles";
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
import { FilterBottomSheet, FilterBottomSheetRef } from "@/components/(buyer)/(index)/FilterBottomSheet";

export default function OrderDetails() {
  const router = useRouter();
  const { user } = useContext(Context) as ContextType;
  const { orderNumber } = useLocalSearchParams();
  const [error, setError] = useState<string>();
  const sheetRef = useRef<FilterBottomSheetRef>(null);

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

  const { data: buyer } = useQuery({
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
        currency: orderDetails?.order?.price?.currencyIsocode,
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
        pathname: "/(buyer)/product-details",
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
      {/* Existing UI */}
      {/* ... */}

      <FilterBottomSheet ref={sheetRef} sheetHeight={200}>
        <View style={buyerProductsStyles.filtersContainer}>
          <View style={profileFlowStyles.content}>
            <Text variant="titleMedium" style={buyerProductsStyles.title}>
              Confirm Dispatch
            </Text>

            <Text style={defaultStyles.dialogSubtitle}>
              Are you sure you want to confirm this dispatch?
            </Text>
          </View>
          <View style={buyerProductsStyles.bottomButtonContainer}>
            <Button
              onPress={() => sheetRef?.current?.close()}
              style={[
                defaultStyles.button,
                defaultStyles.secondaryButton,
                buyerProductsStyles.halfButton,
              ]}
            >
              <Text style={defaultStyles.primaryText}>Cancel</Text>
            </Button>
            <Button
              onPress={() => {
                handleViewReceipt();
                sheetRef?.current?.close();
              }}
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                buyerProductsStyles.halfButton,
              ]}
            >
              <Text style={defaultStyles.buttonText}>Confirm</Text>
            </Button>
          </View>
        </View>
      </FilterBottomSheet>
    </>
  );
}
