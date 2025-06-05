import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
export const farmerIndexStyles = StyleSheet.create({
  bgWhite: {
    backgroundColor: Colors.light["bg"],
  },
  appHeader: {
    backgroundColor: Colors.primary[500],
    width,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  safeArea: {
    width: "100%",
  },
  appHeaderContent: {
    rowGap: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  appHeaderTopContainer: {
    paddingTop: 12,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noticiatonIndicator: {
    position: "absolute",
    backgroundColor: Colors.primary[500],
    width: 8,
    height: 8,
    borderRadius: 8,
    top: 3,
    right: 3,
  },
  appHeaderLeftContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
  },
  iconContainer: {
    height: 48,
    width: 48,
    borderRadius: 48,
    backgroundColor: Colors.light[10],
    alignItems: "center",
    justifyContent: "center",
  },
  greetingsText: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light["10.87"],
  },
  nameText: {
    color: Colors.light[10],
    fontSize: 20,
    lineHeight: 24,
  },
  searchInput: {
    width: "100%",
    marginHorizontal: 24,
    height: 56,
    paddingHorizontal: 0,
    borderRadius: 16,
  },
  searchInputOutline: {
    borderWidth: 0,
    borderColor: Colors.light[10],
  },
  tabItemsMainContainer: {
    width: "100%",
    marginVertical: 24,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabItemContainer: {
    width: "50%",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.grey["border"],
  },
  tabItemActiveContainer: {
    borderBottomWidth: 4,
    borderBottomColor: Colors.primary[500],
  },
  tabItemText: { fontSize: 18, color: Colors.grey["9e"] },
  tabItemActiveText: { color: Colors.primary[500] },
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  orderDetailsContainer: {
    flexShrink: 1,
    flexGrow: 1,
    overflow: "hidden",
    rowGap: 16,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryText: { fontSize: 16, color: Colors.primary[500] },
  flatListContentContainer: {
    rowGap: 24,
    paddingHorizontal: 24,
  },
});
