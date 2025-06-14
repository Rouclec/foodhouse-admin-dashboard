import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const productStyles = StyleSheet.create({
  container: {
    width: "45%",
    rowGap: 12,
  },
  productImage: {
    width: "auto",
    height: 150,
    borderRadius: 12,
  },
  productDescriptionContainer: {
    width: "100%",
    rowGap: 4,
  },
  productName: {
    fontSize: 18,
    lineHeight: 22,
  },
  ratingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  greyText: {
    color: Colors.grey["61"],
  },
});
