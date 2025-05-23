import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";

const { height, width } = Dimensions.get("window");

export const indexStyles = StyleSheet.create({
  splash: {
    backgroundColor: Colors.primary[500],
    flex: 1,
    fontFamily: "Urbanist-Regular",
  },

  highlight1: {
    height: (height * 40) / 100,
    width: (width / 10) * 10,
    position: "absolute",
    left: -(width / 18),
    bottom: -(height / 50),
  },

  highlight2: {
    position: "absolute",
    top: 0,
  },

  highlight3a: {
    position: "absolute",
    bottom: (height / 10) * 2,
    left: width / 10,
  },

  highlight3b: {
    position: "absolute",
    transform: [{ scaleX: -1 }],
    bottom: height / 4,
    right: width / 10,
  },

  textWrapper: {
    position: "relative",
    top: "45%",
  },

  text: {
    textAlign: "center",
    color: Colors.light[10],
    fontSize: 55,
    lineHeight: 96,
  },

  spinnerContainer: {
    position: "absolute",
    bottom: (height * 5) / 100, //positioned 5% vertically from the bottom
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
  },
});
