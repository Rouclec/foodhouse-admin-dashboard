import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const selectPickupLocationStyles = StyleSheet.create({
  flatListContentContainer: {
    rowGap: 24,
    paddingVertical: 24,
  },
  title: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  marginHorizontal24: {
    marginHorizontal: 24,
  },
  marginVertical24: {
    marginVertical: 24,
  },
  card: {
    backgroundColor: Colors.light[10],
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    columnGap: 16,
    alignItems: "center",
  },
  checkOutterContainer: {
    width: 18,
    height: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  checkInnercontainer: {
    width: 12,
    height: 12,
    borderRadius: 12,
  },
  checked: {
    backgroundColor: Colors.primary[500],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.grey["fa"],
  },
  textsContainer: {
    flexGrow: 1,
    flexShrink: 1,
    rowGap: 8,
  },
  text16: {
    fontSize: 16,
  },
  text14: {
    fontSize: 14,
  },
});
