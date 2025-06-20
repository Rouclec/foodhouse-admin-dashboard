import { StyleSheet } from "react-native";

export const salesStyles = StyleSheet.create({
  appHeader: {
    paddingRight: 0,
  },
  heading: {
    textAlign: "center",
    flexShrink: 1,
  },
  flatListContentContainer: {
    rowGap: 24,
  },
  dropDownWrapperContainer: {
    position: "absolute",
    zIndex: 99,
    left: 0,
    right: 0,
    height: 56,
  },
  dropdownStyle: {
    minHeight: 184,
  },
  marginTop80: {
    marginTop: 80,
  },
  mainCardContainer: {
    width: "100%",
    height: "100%",
    rowGap: 16,
  },
  flexShrink1: {
    flexShrink: 1,
  },
  chart: {
    marginTop: 0,
    paddingRight: 0,
    paddingLeft: 0,
    paddingBottom: 0,
    marginBottom: -16,
    marginLeft: 0,
    marginRight: 60,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  title2: { fontSize: 20, marginVertical: 24 },
});
