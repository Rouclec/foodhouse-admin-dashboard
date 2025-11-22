import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const orderDetailsStyles = StyleSheet.create({
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  dialogActions: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
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
  primaryText: {
    fontSize: 16,
    color: Colors.primary[500],
    textAlign: "center",
  },
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
  dialogContainer: {
    backgroundColor: Colors.light["10"],
    borderRadius: 16,
    position: "relative",
    rowGap: 0,
    paddingVertical: 4,
    width: width * 0.84,
    alignSelf: "center",
    marginHorizontal: 8,
    overflow: "hidden",
  },
});
