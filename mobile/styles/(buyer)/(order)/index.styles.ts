import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const deliveryMethodStyles = StyleSheet.create({
  marginVertical12: {
    marginVertical: 12,
  },
  card: {
    backgroundColor: Colors.light[10],
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    columnGap: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors["blue-10"],
  },
  primaryBg: {
    backgroundColor: Colors.primary[50],
  },
  textsContainer: {
    flexGrow: 1,
    flexShrink: 1,
    rowGap: 8,
  },
  checkOutterContainer: {
    width: 18,
    height: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInnercontainer: {
    width: 12,
    height: 12,
    borderRadius: 16,
  },
  checkPrimaryOutterContainer: {
    borderColor: Colors.primary[500],
  },
  blueChecked: {
    backgroundColor: Colors.blue,
  },
  primaryChecked: {
    backgroundColor: Colors.primary[500],
  },
});
