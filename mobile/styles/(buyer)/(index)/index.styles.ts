import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
export const buyerProductsStyles = StyleSheet.create({
  bgWhite: {
    backgroundColor: Colors.light[10],
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
  backButtonContainer: {
    alignItems: "flex-end",
  },
  heading: {
    marginLeft: 0,
  },
  title: {
    marginTop: 24,
    marginHorizontal: 24,
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
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
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
  icon: {
    padding: 8,
  },
  closeIcon: {
    marginLeft: 12,
  },
  flatListContentContainer: {
    rowGap: 24,
    padding: 24,
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
  horizontalFlatList: {
    paddingLeft: 24,
    paddingVertical: 12,
    flex: 1,
  },
  horizontailFlatListContent: {
    paddingRight: 24,
    columnGap: 32,
    alignItems: "center",
    height: "100%",
  },
  categoryItem: {
    height: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.grey["f8"],
    borderRadius: 100,
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primary[500],
  },
  flatListContainer: {
    height: 64,
  },
  filtersContainer: {
    position: "absolute",
    backgroundColor: Colors.light[10],
    zIndex: 99,
    bottom: -64,
    left: 0,
    width: width,
    marginLeft: 0,
    right: 0,
    height: 480,
  },
});
