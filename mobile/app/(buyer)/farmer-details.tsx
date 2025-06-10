import { Context, ContextType } from "@/app/_layout";
import {
  ordersgrpcOrder,
  ordersgrpcOrderStatus,
} from "@/client/orders.swagger";
import { ordersListUserOrdersOptions } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { defaultStyles, ordersStyles as styles } from "@/styles";
import { formatAmount } from "@/utils/amountFormater";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { FC, useContext, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { Chase } from "react-native-animated-spinkit";
import { Appbar, Button, Icon, Text } from "react-native-paper";

const PENDING_ORDER_STATUSES: Array<ordersgrpcOrderStatus> = [
  "OrderStatus_PAYMENT_SUCCESSFUL",
  "OrderStatus_APPROVED",
  "OrderStatus_IN_TRANSIT",
];

const TAB_ITEMS: Array<{
  name: string;
  value: "PRODUCTS" | "REVIEWS";
}> = [
  {
    name: i18n.t("(buyer).farmer-details.products"),
    value: "PRODUCTS",
  },
  {
    name: i18n.t("(buyer).farmer-details.reviews"),
    value: "REVIEWS",
  },
];

interface OrderItemProps {
  item: ordersgrpcOrder;
  onPress: () => void;
}
const OrderItem: FC<OrderItemProps> = ({ item, onPress }) => {
  const {
    isLoading: isProductLoading,
    data: productData,
    isError,
  } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: item?.product ?? "",
      },
    }),
  });

  if (isProductLoading)
    return (
      <View style={defaultStyles.center}>
        <Chase size={16} color={Colors.primary[500]} />
      </View>
    );

  if (isError) {
    return (
      <View style={defaultStyles.center}>
        <Text>{i18n.t("(buyer).farmer-details.couldNotLoadProduct")}</Text>
      </View>
    );
  }

  return (
    <View style={defaultStyles.card}>
      <Image
        source={{ uri: productData?.product?.image }}
        style={styles.productImage}
      />
      <View style={styles.orderDetailsContainer}>
        <Text variant="titleMedium">{productData?.product?.name}</Text>
        <View style={styles.centerRow}>
          <Text variant="titleSmall" style={styles.primaryText}>
            {item?.price?.currencyIsoCode}{" "}
            {formatAmount(item?.price?.value ?? "", { decimalPlaces: 2 })}
          </Text>
        </View>
        <Button style={defaultStyles.primaryButton} onPress={onPress}>
          <Text style={defaultStyles.buttonText}>
            {item?.status === "OrderStatus_DELIVERED"
              ? i18n.t("(buyer).farmer-details.writeReview")
              : i18n.t("(buyer).farmer-details.trackOrder")}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default function FarmerDetails() {
  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const params = useLocalSearchParams();

  console.log({ params });

  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [count, setCount] = useState(10);
  const [tabItem, setTabItem] = useState<{
    name: string;
    value: "PRODUCTS" | "REVIEWS";
  }>(TAB_ITEMS[0]);

  const { data, isLoading } = useQuery({
    ...ordersListUserOrdersOptions({
      path: {
        userId: user?.userId ?? "",
      },
      query: {
        count: count,
        startKey: "",
      },
    }),
  });

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
              <Icon source={"arrow-left"} size={24} color={Colors.dark[0]} />
            </TouchableOpacity>

            <Text variant="titleMedium" style={defaultStyles.heading}>
              {i18n.t("(buyer).farmer-details.farmerInformation")}
            </Text>
            <View />
          </Appbar.Header>
          <View style={styles.tabItemsMainContainer}>
            {TAB_ITEMS.map((item) => {
              return (
                <TouchableOpacity
                  key={item?.value[0]}
                  onPress={() => setTabItem(item)}
                  style={[
                    styles.tabItemContainer,
                    tabItem.value === item?.value &&
                      styles.tabItemActiveContainer,
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.tabItemText,
                      tabItem.value === item?.value && styles.tabItemActiveText,
                    ]}
                  >
                    {item?.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {isLoading && !data ? (
            <View style={[defaultStyles.container, defaultStyles.center]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          ) : (
            <FlatList
              data={data?.orders}
              keyExtractor={(item, index) =>
                item.orderNumber ?? index.toString()
              }
              contentContainerStyle={[
                defaultStyles.paddingVertical,
                styles.flatListContentContainer,
              ]}
              ListEmptyComponent={
                <View style={defaultStyles.noItemsContainer}>
                  <Text style={defaultStyles.noItems}>
                    {i18n.t("(buyer).farmer-details.noOrdersFound")}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              onEndReached={() => {
                if (!hasReachedEnd) {
                  setHasReachedEnd(true);
                }
              }}
              renderItem={({ item }) => {
                return (
                  <OrderItem
                    item={item}
                    onPress={
                      item?.status === "OrderStatus_DELIVERED"
                        ? () => {
                            console.log("delivered order");
                          }
                        : PENDING_ORDER_STATUSES.includes(
                            item?.status as ordersgrpcOrderStatus
                          )
                        ? () => {
                            router.push({
                              pathname: "/(buyer)/track-order",
                              params: {
                                orderNumber: item?.orderNumber,
                              },
                            });
                          }
                        : () => {}
                    }
                  />
                );
              }}
              onScrollBeginDrag={() => {
                // Reset flag when user starts dragging
                setHasReachedEnd(false);
              }}
              onScrollEndDrag={() => {
                if (hasReachedEnd && data?.nextKey) {
                  setCount((prev) => prev + 10);
                  setHasReachedEnd(false);
                }
              }}
              ListFooterComponent={() =>
                data?.nextKey ? (
                  <View style={defaultStyles.listFooterComponent}>
                    {hasReachedEnd && (
                      <ActivityIndicator
                        color={Colors.primary[500]}
                        style={defaultStyles.listFooterIndicator}
                      />
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
