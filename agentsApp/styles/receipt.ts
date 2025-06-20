
import { Colors } from "@/constants";
import { StyleSheet } from "react-native";
export const receiptStyles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    paddingBottom: 100,
    backgroundColor: '#ffffff',
  },
  headerSection: {
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary[500],
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
   
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1.2,
    borderColor: Colors.primary[500],
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary[500],
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary[500],
    marginBottom: 12,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: '#424242',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#212121',
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
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
