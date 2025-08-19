import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const loginstyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light["bg"],
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
    lineHeight: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
    margin: 12,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000",
    textAlign: "left",
    lineHeight: 40,
  },
  input: {
    marginBottom: 5,
    backgroundColor: Colors.grey["fa"],
  },
  inputs: {
    zIndex: 999, flex: 1,
    marginBottom: 5,
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
    backgroundColor: Colors.primary[500],
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
    marginBottom: 24,
  },
  dividerLine: {
    flexGrow: 1,
    height: 1,
    backgroundColor: Colors.grey["border"],
  },
  dividerText: {
    width: 36,
    textAlign: "center",
    color: Colors.grey["61"],
  },
  socialIconsContainer: {
    // flexDirection: "row",
    // alignItems: "center",
    justifyContent: "center",
    rowGap: 16,
    marginBottom: 16,
  },
  socialIcon: {
    // width: 88,
    height: 60,
    flexDirection: "row",
    columnGap: 12,
    borderRadius: 64,
    borderWidth: 1,
    borderColor: Colors.grey["border"],
    justifyContent: "center",
    alignItems: "center",
    // marginHorizontal: 10,
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

  varietiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  varietyCard: {
    width: "45%",
    backgroundColor: "#fff",
    borderRadius: 36,
    padding: 16,
    marginBottom: 16,
    height: 155,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.grey["border"],
  },
  selectedVarietyCard: {
    borderColor: Colors.primary[500],
  },
  varietyImage: {
    width: 80,
    height: 80,
    marginBottom: 8,
    borderRadius: 24,
  },

  varietyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  selectedVarietyText: {
    color: Colors.primary[500],
  },
  varietySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
