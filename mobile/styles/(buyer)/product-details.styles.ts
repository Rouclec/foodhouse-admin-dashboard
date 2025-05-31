import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");
export const productDetailsStyles = StyleSheet.create({
  notFoundContainer: {
    flexGrow: 1,
    marginBottom: 96,
  },
  imageBackground: {
    height: height * 0.4,
    padding: 24,
  },
  bgTransparent: {
    backgroundColor: "tranparent",
    // backgroundColor: "red",
  },
});
