import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const filterBottomSheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary[0],
    zIndex: 1,
  },
  sheetContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
});
