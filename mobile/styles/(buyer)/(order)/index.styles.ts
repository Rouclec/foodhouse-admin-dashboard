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
    borderRadius: 56,
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
});
