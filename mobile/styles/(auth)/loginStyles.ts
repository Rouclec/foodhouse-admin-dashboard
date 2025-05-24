import { StyleSheet, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    zIndex: 1,
  },
  logoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#6dcd47",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: "50%",
    top: 104,
    marginLeft: -80,
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
    paddingTop: 200,
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
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    width: 120,
    textAlign: "center",
    color: "#9e9e9e",
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
    color: "#9e9e9e",
  },
  registerLink: {
    color: "#6dcd47",
    fontWeight: "bold",
  },
});

export default styles;
