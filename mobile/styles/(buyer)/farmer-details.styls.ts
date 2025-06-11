import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const farmerDetailsStyle = StyleSheet.create({
  tabItemsMainContainer: {
    width: "100%",
    marginVertical: 24,
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
  flatListContentContainer: {
    rowGap: 24,
    paddingVertical: 24,
  },
  flatListColumnWrapper: {
    columnGap: 32,
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  smallProfileImage: {
    width: 48,
    height: 48,
    borderRadius: 48,
  },
  addImageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    borderRadius: 100,
    backgroundColor: Colors.grey["9e"],
    alignItems: "center",
    justifyContent: "center",
  },
  smallImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 48,
    backgroundColor: Colors.grey["9e"],
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 56,
    height: 56,
  },
  smallAvatar: {
    width: 24,
    height: 24,
  },
  farmerName: {
    fontSize: 24,
    textAlign: "center",
    lineHeight: 36,
  },
  farmerDetailsContainer: {
    alignItems: "center",
    justifyContent: "center",
    rowGap: 12,
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
  nameAndRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    rowGap: 24,
  },
  farmerDescription: {
    fontSize: 16,
    textAlign: "justify",
    color: Colors.grey["3c"],
    lineHeight: 24,
  },
  reviewContainer: {
    rowGap: 12,
  },
  reviewProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 16,
    flexShrink: 1,
  },
  reviewTopContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 24,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary["50"],
    paddingHorizontal: 16,
    paddingVertical: 6,
    columnGap: 8,
    borderRadius: 100,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.dark["10"],
    textAlign: "justify",
  },
  timeText: {
    fontSize: 12,
    color: Colors.grey["61"],
    lineHeight: 12,
  },
});
