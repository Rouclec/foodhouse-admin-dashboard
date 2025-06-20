import { Colors } from "@/constants";
import { lstat } from "fs";
import { StyleSheet } from "react-native";

export const checkoutStyles = StyleSheet.create({
  notFoundContainer: {
    flexGrow: 1,
    marginBottom: 96,
  },
  orderContainer: {
    rowGap: 24,
  },
  orderDetailsContainer: {
    backgroundColor: Colors.light[10],
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    columnGap: 16,
  },
  rightContainer: {
    rowGap: 12,
  },
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.primary[10],
    borderWidth: 1,
    borderRadius: 12,
  },
  inactiveButton: {
    borderColor: Colors.grey["bd"],
  },
  inactiveText: {
    color: Colors.grey["bd"],
  },
  textCenter: {
    textAlign: "center",
  },
  price: {
    color: Colors.primary[500],
    fontSize: 18,
  },
  greyText: {
    color: Colors.grey["61"],
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 16,
  },
  outterLocationIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary["50"],
  },
  innerLocationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: Colors.primary["500"],
    alignItems: "center",
    justifyContent: "center",
  },
  rowGap8: {
    rowGap: 8,
    flexShrink: 1,
  },
  textSmall: {
    fontSize: 14,
    color: Colors.grey["61"],
  },
  flexColumn: {
    flexDirection: "column",
  },
  rowItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 22,
  },
  textAlignRight: {
    textAlign: "right",
    fontSize: 16,
  },
  lastRowItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey["border"],
  },
  text16: {
    fontSize: 16,
  },
});
