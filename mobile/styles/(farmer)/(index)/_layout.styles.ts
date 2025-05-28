import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const tabStyles = StyleSheet.create({
  tabBar: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
  },
  tabItem: {
    width: 64,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    columnGap: 2,
  },
  tabItemText: {
    color: Colors.grey["9e"],
    fontSize: 10,
  },
  focusedText: {
    color: Colors.primary[500],
  },
});
