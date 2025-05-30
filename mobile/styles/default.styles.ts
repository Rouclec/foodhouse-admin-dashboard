import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const defaultStyles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 32,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: Colors.light["10"],
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  listFooterComponent: {
    paddingVertical: 12,
  },
  listFooterIndicator: { transform: [{ scale: 1.4 }], marginTop: 4 },
  noItemsContainer: {
    paddingBottom: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingLeft: 22,
    paddingVertical: 12,
    marginBottom: 14,
  },
  noItems: {
    color: Colors.dark[10],
    fontSize: 24,
    lineHeight: 36,
    fontWeight: "400",
  },
  paddingVertical: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  heading: {
    marginLeft: -56,
    textAlign: "center",
  },
  paddingBottom: {
    paddingBottom: 64,
  },
  backButtonContainer: {
    backgroundColor: "transparent",
    width: 64,
    height: 64,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  snackbar: {
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.light["0"],
  },
  marginBottom: {
    marginBottom: 64,
  },
  errorText: {
    color: Colors.error,
  },
  errorDarkText: {
    color: Colors.errorDark,
  },
  flex: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    gap: 16,
    justifyContent: "space-evenly",
    flexGrow: 1,
    flexShrink: 1,
  },
  contentContainer: {
    // flex: 1,
    // justifyContent: 'center',
    gap: 4,
    paddingVertical: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  bottomButtonContainer: {
    // position: "absolute",
    alignSelf: "center",
    bottom: 0,
    backgroundColor: Colors.light["10"],
    // backgroundColor: "transparent",
    // height: 96,
    height: "auto",
    width: width,
    paddingBottom: 32,
    paddingHorizontal: 32,
    rowGap: 12,
    paddingTop: 12,
  },
  bottomContainerWithContent: {
    paddingTop: 12,
    // position: 'absolute',
    alignSelf: "center",
    bottom: 0,
    paddingBottom: 24,
    backgroundColor: Colors.light["10"],
    width: width,
    paddingHorizontal: 16,
    rowGap: 12,
  },
  button: {
    // flexWrap: "wrap",
    justifyContent: "center",
    borderRadius: 100,
    minHeight: 48,
    minWidth: 124,
  },
  primaryButton: {
    backgroundColor: Colors.primary[500],
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: Colors.primary[50],
  },
  secondaryButtonText: {
    color: Colors.primary[500],
  },
  gentiumText: {
    fontFamily: "gentium",
  },
  font14: {
    fontSize: 14,
  },
  buttonText: {
    // flexShrink: 1,
    flexWrap: "wrap",
    fontWeight: "500",
    color: Colors.light["10"],
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light[10],
    justifyContent: "space-between",
  },
  headerTextContainer: {
    flexGrow: 1,
    marginRight: 72,
  },
  homeAddressheaderTextContainer: {
    flexGrow: 1,
    marginRight: 32,
  },
  headerText: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "500",
    color: Colors.primary["500"],
  },
  subheaderText: {
    textAlign: "center",
  },
  input: {
    flexGrow: 1,
    height: 52,
    fontSize: 16,
    borderRadius: 4,
    paddingHorizontal: 16,
    // bottom: 2,
  },
  inputsContainer: {
    marginTop: 16,
    paddingBottom: 48,
    rowGap: 8,
  },
  outlineStyle: {
    borderWidth: 0,
    borderColor: "transparent",
  },
  linkText: {
    color: Colors.primary[300],
  },
  relativeContainer: {
    position: "relative",
  },
  dialogContainer: {
    backgroundColor: Colors.light["10"],
    borderRadius: 8,
    position: "relative",
    rowGap: 0,
    paddingVertical: 4,
    width: width * 0.94,
    alignSelf: "center",
    marginHorizontal: 0,
  },
  dialogSuccessContainer: {
    backgroundColor: Colors.light[10],
    alignItems: "center",
    padding: 32,
    borderRadius: 48,
  },
  paddingHorizontal: {
    marginTop: 16,
    paddingLeft: 12,
    paddingRight: 12,
    columnGap: 16,
  },
  dialogSubtitleContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    columnGap: 4,
    paddingHorizontal: 12,
    paddingBottom: 16,
    overflowX: "hidden",
    flexShrink: 1,
  },
  dialogFirstContent: {
    alignSelf: "flex-end",
    paddingVertical: 0,
    marginTop: 4,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 2,
    paddingLeft: 0,
    paddingRight: 4,
  },
  dialogTitle: {
    fontSize: 16,
    color: Colors.primary[500],
    textAlign: "center",
    fontFamily: "gentium",
    marginHorizontal: 24,
  },
  dialogSubtitle: {
    textAlign: "center",
  },
  dialogActionContainer: {
    flexDirection: "row",
    columnGap: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    paddingBottom: 0,
    overflowX: "hidden",
  },
  dialogContentContainer: { paddingTop: 0, paddingBottom: 2 },
  successImage: { width: 180, height: 180 },
  primaryText: {
    color: Colors.primary[500],
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  textCenter: {
    textAlign: "center",
  },
});
