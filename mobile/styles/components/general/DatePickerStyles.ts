// import { Colors } from '@/constants';
import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const DatePickerStyles = StyleSheet.create({
  buttonContainer: {
    backgroundColor: Colors.grey["ea"],
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    height: 64,
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.primary["300"],
  },
  placeholder: {
    color: Colors.grey["e8"],
  },
  text: {
    fontSize: 14,
    color: Colors.grey["surface"],
  },
});
