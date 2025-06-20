import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const myProductStyles = StyleSheet.create({
  appHeader: {
    paddingRight: 0,
  },
  backButtonContainer: {
    alignItems: "flex-end",
  },
  heading: {
    marginLeft: 0,
  },
  title: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  searchContainer: {
    position: "absolute",
    top: 0,
    height: "100%",
    width: "100%",
    backgroundColor: Colors.light["bg"],
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 48,
  },
  icon: {
    padding: 8,
  },
  closeIcon: {
    marginLeft: 12,
  },
  flatListContentContainer: {
    rowGap: 24,
  },
  flatListColumnWrapper: {
    columnGap: 32,
    alignItems: "center",
    justifyContent: "space-between",
  },
  addProductButton: {
    position: "absolute",
    right: 24,
    backgroundColor: Colors.primary[500],
    width: 64,
    height: 64,
    borderRadius: 64,
    bottom: 56,
    alignItems: "center",
    justifyContent: "center",
  },
});
