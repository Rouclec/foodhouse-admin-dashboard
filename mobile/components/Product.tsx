import { productsgrpcProduct } from "@/client/products.swagger";
import React, { FC } from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { defaultStyles, productStyles as styles } from "@/styles";
import { Text } from "react-native-paper";

interface Props {
  product: productsgrpcProduct;
  OnPress?: () => void;
}
export const Product: FC<Props> = ({ product, OnPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => OnPress?.()}
      disabled={!OnPress}
    >
      <Image
        source={{ uri: product.image ?? "" }}
        style={styles.productImage}
      />
      <View style={styles.productDescriptionContainer}>
        <Text variant="titleLarge" style={styles.productName}>{product.name}</Text>
        {/* <View style={styles.ratingsContainer}>
          <Text>star</Text>
          <View />
          <Text>4.5</Text>
          <View>
            <Text>New</Text>
          </View>
        </View> */}
        <Text style={defaultStyles.primaryText}>
          {product.amount?.currencyIsoCode} {product.amount?.value}
          {/* <Text>{product.unitType}</Text> */}
          <Text style={styles.greyText}>
            {product.unitType?.slug?.replace("per_", "/")}
          </Text>{" "}
          {/* Use actual unit type*/}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
