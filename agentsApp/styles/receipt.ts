import { Colors } from "@/constants";
import { Dimensions, StyleSheet } from "react-native";
const { width } = Dimensions.get("window");

export const receiptStyles = StyleSheet.create({
  scrollContainer: {
    padding: 10,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: "bold",
    color: Colors.primary[500],
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },

  formContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: Colors.primary[500],
    shadowColor: Colors.dark[0],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  formTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: Colors.primary[500],
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 25,
  },

  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logocircle: {
    width: 80,
    height: 80,
    backgroundColor: Colors.primary[500],
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  Logotext: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 22,
    textAlign: "center",
  },

  section: {
    marginBottom: 25,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary[500],
    marginBottom: 12,
  },

  infoRow: {
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: "700",
    color: Colors.primary[500],
    fontSize: 15,
  },
  infoValue: {
    fontWeight: "400",
    color: "#444",
    fontSize: 15,
  },

  footer: {
    marginTop: 30,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontWeight: "600",
    fontSize: 14,
  },
  footerIcon: {
    marginRight: 2,
  },

  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary[500],
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: "#212121",
    marginLeft: 0,
  },
  detailRow: {
    flexDirection: "column",
    marginBottom: 10,
  },

  uploadSection: {
    alignItems: "center",
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  dialogContentWrapper: {
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
  },
  inputMargin: {
    marginBottom: 20,
  },
  subTitle: {
  color: '#555',
  fontSize: 14,
  marginBottom: 12,
  textAlign: 'center',
},
dialogContainer: {
    backgroundColor: Colors.light["10"],
    borderRadius: 16,
    position: "relative",
    rowGap: 0,
    paddingVertical: 4,
    width: width * 0.84,
    alignSelf: "center",
    marginHorizontal: 8,
  },

  primaryText: {
    color: Colors.primary[500],
    textAlign: 'center',
  },
  snackbarContainer: {
  position: "absolute",
  top: 50,
  alignSelf: "center",
  backgroundColor: "#fff",
  borderColor: "red",
  borderWidth: 2,
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 10,
  zIndex: 999,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},

snackbarText: {
  color: "#000",
  fontSize: 14,
},


});
