import Colors from "@/constants/Colors";
import { Dimensions, StyleSheet } from "react-native";

const { height } = Dimensions.get("window");
export const forgotPasswordVerifyOtpStyles = StyleSheet.create({
  directionContainer: {
    alignItems: "center",
    width: "100%",
    marginTop: 60,
  },
  direction: {
    textAlign: "center",
    fontSize: 18,
  },
  otpContainer: {
    marginVertical: 60,
  },
  otpText: {
    fontSize: 18,
  },
  otpBox: {
    backgroundColor: Colors.light[0],
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 56,
    minWidth: 68,
    color: Colors.grey["surface"],
  },
  resendTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
  },
  link: {
    color: Colors.primary[500],
  },
  text: {
    color: Colors.dark[0],
  },
});
