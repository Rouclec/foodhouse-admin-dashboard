import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const tabStyles = StyleSheet.create({
  tabBar: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingTop: 16,
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    
  },
  tabItem: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    columnGap: 1,
  },
  tabItemText: {
    color: Colors.grey["9e"],
    fontSize: 10,
  },
  focusedText: {
    color: Colors.primary[500],
  },
});
