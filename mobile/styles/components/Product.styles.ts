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
    rowGap: 10,
  },
  ratingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
});
