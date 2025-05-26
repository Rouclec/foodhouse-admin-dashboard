import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const createNewPasswordStyles = StyleSheet.create({
  illustrationImageContainer: {
    alignSelf: "center",
  },
  contentContainer: {
    flex: 1,
    rowGap: 24,
    justifyContent: "center",
  },
  successImage: { width: 180, height: 180 },
  dialogContainer: {
    backgroundColor: Colors.light[10],
    alignItems: "center",
    padding: 32,
    borderRadius: 48
  },
  dialogTitle: {
    color: Colors.primary[500],
  },
  dialogContent: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: "center",
  },
});
