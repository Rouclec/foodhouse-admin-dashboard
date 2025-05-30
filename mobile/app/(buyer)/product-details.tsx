import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

export default function ProductDetails() {
  const params = useLocalSearchParams();

  console.log(params?.product);
  return (
    <View>
      <Text>Product details</Text>
    </View>
  );
}
