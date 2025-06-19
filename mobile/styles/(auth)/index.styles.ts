import { Colors } from "@/constants";
import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const imageWidth = screenWidth / 3.5;
const imageHeight = (imageWidth * 16) / 11;

export const index1 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6dcd47",
    
  },
  
  safeArea: {
    flex: 1,
    flexDirection: "column",
    paddingTop: 32,
    backgroundColor: Colors.primary[500]
  },
  headingH1: {
    fontFamily: "Urbanist-Regular",
    fontWeight: "bold",
    fontSize: 48,
    color: "#FFFFFF",
    marginBottom: 20,
  },
  subText: {
    fontFamily: "Urbanist-Regular",
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  textContainer: {
    marginTop: screenHeight * 0.65,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  imageContainer: {
    position: "absolute",
    flexDirection: "row",
    left: -imageWidth / 5,
    top: screenHeight * 0.05,
   
  },
  imageRows: {},
  imageRow2: {
    top: -imageHeight / 2,
  },
  imageRow4: {
    top: -imageHeight / 5,
  },
  imageWrapper: {
    width: imageWidth,
    height: imageHeight,
    margin: 3,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: "#fff",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  nopadding: {
    paddingBottom: 0,
  },
  
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  button: {
    width: 380,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#1C1C1C",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});



