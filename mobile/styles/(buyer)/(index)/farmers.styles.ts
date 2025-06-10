import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const farmersStyles = StyleSheet.create({
  title: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: "bold",
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
  farmerItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 16,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 20,
    flexShrink: 1,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.grey["9e"],
  },
  profileImage: {
    height: 60,
    width: 60,
    borderRadius: 60,
  },
  nameContainer: { rowGap: 4, flexShrink: 1 },
  text18: {
    fontSize: 18,
  },
  ratingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 2,
  },
  ratingsText: {
    fontSize: 14,
    color: Colors.grey["61"],
  },
  button: {
    backgroundColor: Colors.primary[500],
    borderRadius: 100,
  },
});
