import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { Colors } from "@/constants";
import i18n from "@/i18n";
import { defaultStyles } from "@/styles";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Chase } from "react-native-animated-spinkit";
import { Appbar, Button, Icon, Text } from "react-native-paper";
import { checkoutStyles as styles } from "@/styles";
import { formatAmount } from "@/utils/amountFormater";
import * as Location from "expo-location";
import { Region } from "react-native-maps";
import { ordersCreateOrderMutation } from "@/client/orders.swagger/@tanstack/react-query.gen";
import { Context, ContextType } from "@/app/_layout";

export default function Checkout() {
  const router = useRouter();

  const { user } = useContext(Context) as ContextType;

  const [productId, setProductId] = useState<string>();
  const [errorLoadingProduct, setErrorLoadingProduct] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    description: string;
    region: Region;
  }>();

  const params = useLocalSearchParams();

  useEffect(() => {
    try {
      setProductId(params?.productId as string);
    } catch (error) {
      setErrorLoadingProduct(true);
      console.error("error getting product from params: ", error);
    }
  }, []);

  const { data, isError, isLoading } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: productId ?? "",
      },
    }),
    enabled: !!productId,
  });

  useEffect(() => {
    setTotalPrice((data?.product?.amount?.value ?? 0) * quantity);
  }, [data, quantity]);

  useEffect(() => {
    const handleUseCurrentLocation = async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          alert(i18n.t("(buyer).(order).index.pleaseAcceptPermissions"));
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});

        const address = await Location.reverseGeocodeAsync(
          currentLocation.coords
        );

        setLocation({
          description: `${address[0].name}, ${address[0].city}, ${address[0].country}`,
          region: {
            ...currentLocation.coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
        });
      } catch (error) {
        console.error("Error getting location: ", error);
        alert(i18n.t("(buyer).(order).index.errorGettingLocation"));
      } finally {
        setLoading(false);
      }
    };

    handleUseCurrentLocation();
  }, []);

  const { mutateAsync } = useMutation({
    ...ordersCreateOrderMutation(),
    onSuccess: (data) => {
      console.log({ data }, "create order data");
    },
    onError: (error) => {
      console.log({ error }, "creating order");
    },
  });

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      await mutateAsync({
        body: {
          productId: productId,
          quantity: quantity.toString(),
          deliveryLocation: {
            address: location?.description,
            lon: location?.region?.longitude,
            lat: location?.region?.latitude,
          },
        },
        path: {
          userId: user?.userId ?? "",
        },
      });
    } catch (error) {
      console.error("error creating order ", error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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
              <Icon source={"arrow-left"} size={24} color={Colors.dark[0]} />
            </TouchableOpacity>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[defaultStyles.center, styles.notFoundContainer]}>
              <Chase size={56} color={Colors.primary[500]} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (isError || errorLoadingProduct) {
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
              {i18n.t("(buyer).(order).index.checkout")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[defaultStyles.center, styles.notFoundContainer]}>
              <Text>{i18n.t("(buyer).(order).index.couldNotLoad")}</Text>
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
              {i18n.t("(buyer).(order).index.checkout")}
            </Text>
            <View />
          </Appbar.Header>
          <ScrollView
            contentContainerStyle={defaultStyles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.orderContainer}>
              <Text variant="titleMedium">
                {i18n.t("(buyer).(order).index.order")}
              </Text>
              <View style={styles.orderDetailsContainer}>
                <Image
                  source={{ uri: data?.product?.image }}
                  style={styles.productImage}
                />
                <View style={styles.rightContainer}>
                  <Text variant="titleMedium">{data?.product?.name}</Text>
                  <Text style={styles.price}>
                    {data?.product?.amount?.currencyIsoCode}{" "}
                    {data?.product?.amount?.value}
                    <Text style={styles.greyText}>
                      {" "}
                      {data?.product?.unitType?.slug?.replace("per_", "/")}
                    </Text>
                  </Text>
                  <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                      disabled={quantity === 1}
                      onPress={() => {
                        setQuantity((prev) => prev - 1);
                      }}
                      style={[
                        styles.quantityButton,
                        quantity === 1 && styles.inactiveButton,
                      ]}
                    >
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.textCenter,
                          quantity === 1 && styles.inactiveText,
                        ]}
                      >
                        -
                      </Text>
                    </TouchableOpacity>
                    <Text>{String(quantity).padStart(2, "0")}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setQuantity((prev) => prev + 1);
                      }}
                      style={styles.quantityButton}
                    >
                      <Text variant="titleMedium" style={styles.textCenter}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <Text variant="titleMedium">
                {i18n.t("(buyer).(order).index.shippingAddress")}
              </Text>
              <View style={[styles.orderDetailsContainer, styles.flexRow]}>
                <View style={styles.outterLocationIconContainer}>
                  <View style={styles.innerLocationIconContainer}>
                    <Icon
                      source={"map-marker"}
                      size={24}
                      color={Colors.light[10]}
                    />
                  </View>
                </View>
                {loading ? (
                  <Chase size={24} color={Colors.primary[500]} />
                ) : (
                  <View style={styles.rowGap8}>
                    <Text variant="titleMedium">
                      {i18n.t("(buyer).(order).index.currentLocation")}
                    </Text>
                    <Text style={styles.textSmall}>
                      {location?.description}
                    </Text>
                  </View>
                )}
                <TouchableOpacity>
                  <Icon source={"pencil-outline"} size={24} />
                </TouchableOpacity>
              </View>
              <View style={[styles.orderDetailsContainer, styles.flexColumn]}>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t("(buyer).(order).index.amount")}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {data?.product?.amount?.currencyIsoCode}{" "}
                    {formatAmount(totalPrice?.toString() ?? "", {
                      decimalPlaces: 2,
                    })}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t("(buyer).(order).index.delivery")}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {data?.product?.amount?.currencyIsoCode}{" "}
                    {formatAmount("0", {
                      decimalPlaces: 2,
                    })}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t("(buyer).(order).index.transactionCharges")}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {data?.product?.amount?.currencyIsoCode}{" "}
                    {formatAmount(
                      ((totalPrice ?? 0) * 0.03)?.toString() ?? "",
                      {
                        decimalPlaces: 2,
                      }
                    )}
                  </Text>
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.textSmall}>
                    {i18n.t("(buyer).(order).index.serviceCharges")}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {data?.product?.amount?.currencyIsoCode}{" "}
                    {formatAmount(
                      ((totalPrice ?? 0) * 0.05)?.toString() ?? "",
                      {
                        decimalPlaces: 2,
                      }
                    )}
                  </Text>
                </View>
                <View style={[styles.rowItem, styles.lastRowItem]}>
                  <Text style={styles.textSmall}>
                    {i18n.t("(buyer).(order).index.total")}
                  </Text>
                  <Text style={styles.textAlignRight} variant="titleMedium">
                    {data?.product?.amount?.currencyIsoCode}{" "}
                    {formatAmount(
                      ((totalPrice ?? 0) * 1.08)?.toString() ?? "",
                      {
                        decimalPlaces: 2,
                      }
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <View style={defaultStyles.bottomButtonContainer}>
        <Button
          style={[defaultStyles.button, defaultStyles.primaryButton]}
          onPress={handleCreateOrder}
        >
          <Text variant="titleMedium" style={defaultStyles?.buttonText}>
            {i18n.t("(buyer).(order).index.confirmPayment")}{" "}
            {data?.product?.amount?.currencyIsoCode}{" "}
            {formatAmount(((totalPrice ?? 0) * 1.08)?.toString() ?? "", {
              decimalPlaces: 2,
            })}
          </Text>
        </Button>
      </View>
    </>
  );
}
