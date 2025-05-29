import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const imagePickerStyles = StyleSheet.create({
  dialog: {
    backgroundColor: "transparent",
    bottom: 0,
    position: "absolute",
    left: 0,
    right: 0,
    rowGap: 12,
  },
  content: {
    backgroundColor: Colors.light[10],
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 0,
    borderRadius: 16,
    paddingHorizontal: 0,
  },
  innerContent: {
    paddingBottom: 18,
    padding: 18,
  },
  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey["border"],
  },
  buttonText: {
    color: Colors.primary[500],
    fontSize: 18,
  },
    bottomContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
    },
    button1: {
      flex: 1,
      marginHorizontal: 10,
      paddingVertical: 4,
      height: 50,
      borderRadius: 28,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors.primary[500],
    },
    skipButton: {
      borderColor: "#e8e8e8",
      backgroundColor: Colors.primary[300],
    },
    skipButtonText: {
      color: "black",
    },
});
