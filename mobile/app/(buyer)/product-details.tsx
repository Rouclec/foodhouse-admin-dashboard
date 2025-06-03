import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import { defaultStyles, productDetailsStyles as styles } from "@/styles";
import { Colors } from "@/constants";
import { Chase } from "react-native-animated-spinkit";
import { Appbar, Button, Icon, Text } from "react-native-paper";
import i18n from "@/i18n";
import { Context, ContextType } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { usersGetFarmerByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";

export default function ProductDetails() {
  const { user, productId, setProductId } = useContext(Context) as ContextType;
  const [errorLoadingProduct, setErrorLoadingProduct] = useState(false);

  const params = useLocalSearchParams();
  const router = useRouter();

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

  const { data: farmer, isLoading: _isFarmerLoading } = useQuery({
    ...usersGetFarmerByIdOptions({
      path: {
        farmerId: data?.product?.createdBy ?? "",
        userId: user?.userId ?? "",
      },
    }),
    enabled: !!data,
  });

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
              <Text>{i18n.t("(buyer).product-details.couldNotLoad")}</Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <>
      <View style={[defaultStyles.flex, defaultStyles.bgWhite]}>
        <ImageBackground
          source={{ uri: data?.product?.image }}
          style={styles.imageBackground}
          resizeMethod="auto"
        >
          <Appbar.Header
            style={[defaultStyles.appHeader, styles.bgTransparent]}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={defaultStyles.backButtonContainer}
            >
              <Icon source={"arrow-left"} size={24} color={Colors.light[10]} />
            </TouchableOpacity>
          </Appbar.Header>
        </ImageBackground>
        <ScrollView
          contentContainerStyle={defaultStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
            <View>
              <Text variant="titleMedium" style={styles.productName}>
                {data?.product?.name}
              </Text>
              {/* <View>
                Product rating container
              </View> */}
            </View>
            <View style={styles.rowGap12}>
              <Text variant="titleMedium">
                {i18n.t("(buyer).product-details.description")}
              </Text>
              <Text style={styles.justifyText} variant="bodyLarge">
                {data?.product?.description}
              </Text>
            </View>
            <View style={styles.rowGap12}>
              <Text variant="titleMedium">
                {i18n.t("(buyer).product-details.farmer")}
              </Text>
              <View style={styles.farmerDetailscontainer}>
                <View style={styles.farmerProfileImageContainer}>
                  {farmer?.user?.profileImage ? (
                    <Image
                      source={{ uri: farmer?.user?.profileImage }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/avatar.png")}
                      style={styles.avatar}
                    />
                  )}
                </View>
                <View style={styles.nameAndCheckContainer}>
                  <Text variant="titleMedium" style={styles.farmerName}>
                    {farmer?.user?.firstName} {farmer?.user?.lastName}
                  </Text>
                  <Icon
                    source={"check-decagram"}
                    color={Colors.blue}
                    size={18}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
        <SafeAreaView>
          <View
            style={[defaultStyles.bottomContainerWithContent, styles.flexRow]}
          >
            <View>
              <Text style={styles.priceLabel}>
                {i18n.t("(buyer).product-details.price")}
              </Text>
              <Text style={styles.price} variant="titleMedium">
                {data?.product?.amount?.currencyIsoCode}
                {data?.product?.amount?.value}
                <Text style={styles.greyText}>
                  {" "}
                  {data?.product?.unitType?.slug?.replace("per_", "/")}
                </Text>
              </Text>
            </View>
            <Button
              style={[
                defaultStyles.button,
                defaultStyles.primaryButton,
                styles.halfContainer,
              ]}
              onPress={() => {
                setProductId(data?.product?.id);
                router.push("/(buyer)/(order)");
              }}
            >
              <Text style={defaultStyles.buttonText}>
                {i18n.t("(buyer).product-details.orderNow")}
              </Text>
            </Button>
          </View>
        </SafeAreaView>
      </View>
    </>
  );
}
