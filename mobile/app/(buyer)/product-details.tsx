import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
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
import { Appbar, Icon, Text } from "react-native-paper";
import i18n from "@/i18n";
import { Context, ContextType } from "../_layout";
import { useQuery } from "@tanstack/react-query";
import { productsGetProductOptions } from "@/client/products.swagger/@tanstack/react-query.gen";
import { usersGetUserById } from "@/client/users.swagger";
import { usersGetUserByIdOptions } from "@/client/users.swagger/@tanstack/react-query.gen";

export default function ProductDetails() {
  const { user } = useContext(Context) as ContextType;
  const [productId, setProductId] = useState<string>();
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

  const { data: farmer, isLoading: isFarmerLoading } = useQuery({
    ...usersGetUserByIdOptions({
      path: {
        userId: data?.product?.createdBy ?? "",
      },
    }),
    enabled: !!data,
  });

  console.log({ farmer });

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
      {/* <KeyboardAvoidingView
        style={defaultStyles.flex}
        behavior={"padding"}
        keyboardVerticalOffset={0}
      > */}
      <View style={defaultStyles.flex}>
        <ImageBackground
          source={{ uri: data?.product?.image }}
          style={styles.imageBackground}
          resizeMethod="auto"
        >
          {/* <SafeAreaView> */}
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
          {/* </SafeAreaView> */}
        </ImageBackground>
        <ScrollView
          contentContainerStyle={defaultStyles.scrollContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[defaultStyles.center, styles.notFoundContainer]}>
            <Text>{data?.product?.name}</Text>
          </View>
        </ScrollView>
      </View>
      {/* </KeyboardAvoidingView> */}
    </>
  );
}
