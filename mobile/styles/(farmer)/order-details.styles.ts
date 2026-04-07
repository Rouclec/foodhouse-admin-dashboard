import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";

const screenWidth = Dimensions.get("window").width;

export const orderDetailsStyles = StyleSheet.create({
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  orderDetailsContainer: {
    flexShrink: 1,
    flexGrow: 1,
    overflow: "hidden",
    rowGap: 16,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryText: { fontSize: 16, color: Colors.primary[500] },
  mainContainer: {
    paddingVertical: 24,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 24,
    overflow: "hidden",
  },
  leftText: {
    flexShrink: 1,
    fontSize: 14,
    color: Colors.grey["61"],
  },
  rightText: { flexShrink: 1, textAlign: "right", fontSize: 16 },
  card: {
    backgroundColor: Colors.light[10],
    padding: 20,
    borderRadius: 16,
    rowGap: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  errorButton: {
    backgroundColor: Colors.error,
  },
  dialogContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  widthFull: { width: "100%" },
  inputContainer: { minHeight: 96, width: "100%", maxWidth: "100%" },
  selfCenter: { alignSelf: "center" },
  actionContainer: {
    width: "100%",
    paddingBottom: 12,
    flexDirection: "column",
    gap: 12,
    alignItems: "stretch",
    alignSelf: "stretch",
  },
  payoutPhoneDialog: {
    width: Math.min(screenWidth * 0.92, 400),
    maxWidth: "100%",
    alignSelf: "center",
    alignItems: "stretch",
  },
});
