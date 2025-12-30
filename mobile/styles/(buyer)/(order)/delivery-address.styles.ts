import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const deliveryAddressStyles = StyleSheet.create({
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    // height: 420,
    backgroundColor: Colors.light[10],
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    padding: 16,
    zIndex: 2,
    elevation: 10, // for Android shadow and stacking
  },
  notch: {
    width: 40,
    height: 4,
    borderRadius: 2.5,
    backgroundColor: Colors.grey["79"],
    alignSelf: "center",
    marginBottom: 12,
  },
  listView: {
    position: "absolute",
    top: 76,
    backgroundColor: Colors.light["10"],
    width: "100%",
    paddingHorizontal: 16,
    borderRadius: 16,
    maxHeight: 220,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.grey["bg"],
  },
  z99: {
    zIndex: 99,
  },
  marginTop12: { marginTop: 12 },
  bottomSheetContent: {
    marginVertical: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.grey["border"],
    paddingVertical: 24,
  },
  flexRow: {
    flexDirection: "row",
    columnGap: 18,
    alignItems: "center",
  },
  flexRowSmall: {
    flexDirection: "row",
    columnGap: 8,
    alignItems: "center",
  },
  checkBox: {
    width: 26,
    height: 26,
    borderRadius: 12,
  },
  googlePlacesAutocompleteTextInput: {
    backgroundColor: Colors.grey["fa"],
    marginTop: 12,
    height: 52,
    borderRadius: 10,
  },
});
