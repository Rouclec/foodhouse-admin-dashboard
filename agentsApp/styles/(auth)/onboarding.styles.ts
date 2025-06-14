import { Colors } from "@/constants";
import { StyleSheet, Dimensions } from "react-native";

// const DOT_SIZE = 10;

export const onboardingStyles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: Colors.primary[300],
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  image: {
    width: "90%",
    height: "80%",
    borderRadius: 20,
    marginTop: 20,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "bold",
    letterSpacing: -0.3,
    color: Colors.dark[10],
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
    color: Colors.grey["61"],
    paddingHorizontal: 5,
    textAlign: "center",
  },
  dotContainer: {
    position: "absolute",
    bottom: 120,
    flexDirection: "row",
    justifyContent: "center",
    alignSelf: "center",
    gap: 10,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary[500],
    marginHorizontal: 5,
  },

  buttonContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: Colors.light[10],
    fontSize: 18,
    fontWeight: "bold",
  },
});
