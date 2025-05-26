import { Colors } from "@/constants";
import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

export const loginstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light[10],
  },
  header: {
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logoCircle: {
    marginTop: 40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#000",
    textAlign: "center",
  },
  input: {
    marginBottom: 5,
    backgroundColor: "#FAFAFA",
  },
  errorText: {
    color: "#FF0000",
    marginBottom: 15,
    marginLeft: 5,
    fontSize: 12,
  },
  errorMessage: {
    color: "#FF0000",
    marginBottom: 15,
    textAlign: "center",
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#6dcd47",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.grey["border"],
  },
  dividerText: {
    width: 120,
    textAlign: "center",
    color: Colors.grey["61"],
  },
  socialIconsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  socialIcon: {
    width: 88,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  registerText: {
    color: Colors.grey["61"],
  },
  registerLink: {
    color: Colors.primary[500],
    fontWeight: "bold",
  },
});
