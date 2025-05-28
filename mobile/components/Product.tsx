import { productsgrpcProduct } from "@/client/products.swagger";
import React, { FC } from "react";
import { View, Text, Image } from "react-native";
import { productStyles as styles } from "@/styles";

interface Props {
  product: productsgrpcProduct;
}
export const Product: FC<Props> = ({ product }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: product.image ?? "" }}
        style={styles.productImage}
      />
      <View style={styles.productDescriptionContainer}>
        <Text>{product.name}</Text>
        <View style={styles.ratingsContainer}>
          <Text>star</Text>
          <View />
          <Text>4.5</Text>
          <View>
            <Text>New</Text>
          </View>
        </View>
        <Text>
          {product.amount?.currencyIsoCode} {product.amount?.value}
          {/* <Text>{product.unitType}</Text> */}
          <Text>/kg</Text> {/* Use actual unit type*/}
        </Text>
      </View>
    </View>
  );
};
