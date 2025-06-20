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
    color: '#2e7d32', // Dark green
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#757575', // Medium gray
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#c8e6c9', // Light green border
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: '#2e7d32', // Dark green
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
    padding: 12,
    backgroundColor: '#f5f5f5', // Light gray background
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#81c784', // Medium green accent border
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: '#2e7d32', // Dark green
    marginBottom: 12,
  },
//   detailItem: {
//     marginBottom: 15,
//     flex:1,
//   },
detailItem: {
  marginBottom: 15,
  flexDirection: 'column',
  justifyContent: 'space-between'
},
  detailLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: '#212121', // Dark text
    marginBottom: 5,
  },
  detailValue: {
    fontSize: 15,
    color: '#424242', // Slightly lighter dark text
    marginLeft: 10,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "flex-start",
    padding:20,
  },
  uploadSection: {
    alignItems: "center",
    marginTop: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#c8e6c9', // Light green border
    borderRadius: 8,
    backgroundColor: '#f5f5f5', // Light gray background
  },
  uploadButton: {
    backgroundColor: '#2e7d32', // Dark green
    borderRadius: 6,
    paddingVertical: 12,
    width: "100%",
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#ffffff', // White
    fontSize: 16,
    fontWeight: "bold",
  },
  uploadNote: {
    fontSize: 14,
    color: '#757575', // Medium gray
    textAlign: "center",
  },
});