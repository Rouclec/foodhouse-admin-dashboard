import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const dropdownStyles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.grey["bg"],
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 52,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.grey["fa"],
    position: "relative",
  },
  label: {
    position: "absolute",
    left: 16,
    fontSize: 17,
    backgroundColor: Colors.grey["fa"],
    paddingHorizontal: 6,
    zIndex: 1,
  },
  valueText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingHorizontal: 16,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: Colors.grey["border"],
    borderBottomWidth: 0.6,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
  },
});
