import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

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
  inputContainer: { height: 96 },
  selfCenter: { alignSelf: "center" },
  actionContainer: { width: "100%", paddingBottom: 12 },
});
