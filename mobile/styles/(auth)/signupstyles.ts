import { Colors } from '@/constants';
import { Platform, StyleSheet } from 'react-native';

export const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  
   label: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  closeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey['border'],
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  mainConatiner: {
    flex: 1,
    backgroundColor: "fff",
  },
  heading: {
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'left',
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 32,
    // color: Colors.primary[500],
  },
  scrollContainer: {
    flexGrow: 1,
    marginTop: 18,
    
  },
  allInput: {
    top: 10,
    gap: 34,
    paddingBottom: Platform.OS === 'ios' ? 0 : 120,
  },
  subheading: {
    textAlign: 'left',
    width: '100%',
    color: Colors.grey['79'],
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 10,
  },
  subheadingFull: {
    marginBottom: 20,
    textAlign: 'left',
    color: Colors.grey['79'],
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: Colors.grey['ea'],
    flexGrow: 1,
    height: 56,
    fontSize: 14,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: 'transparent',
    color: Colors.grey['e8'],
  },
  outlineInput: {
    borderWidth: 2,
    borderColor: Colors.grey['ea'],
  },
  focusedInput: {
    backgroundColor: Colors.grey['ea'],
    flexGrow: 1,
    height: 64,
    fontSize: 18,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderColor: Colors.grey['ea'],
    borderWidth: 2,
    color: Colors.grey['e7'],
  },
  inputContentStyle: { justifyContent: 'center' },
  buttonText: {
    color: Colors.light['10'],
    fontWeight: '500',
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary['disabled'],
    paddingBottom: 32,
    paddingHorizontal: 40,
    alignItems: 'center', // Align items at the start vertically
    columnGap: 4, // Space between checkbox and text
    marginHorizontal: 0,
    justifyContent: 'flex-start',
  },
  text: {
    flex: 1, // Allow text to take available space
    flexWrap: 'wrap', // Wrap text to the next line
    fontSize: 12, // Adjust font size for better readability
    overflow: 'hidden', // Prevent any overflow
    color: Colors.grey['surface'],
    lineHeight: 20,
  },
  link: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: Colors.grey['surface'],
    fontSize: 12,
  },
  snackbar: {
    borderWidth: 1,
    borderColor: 'red',
    backgroundColor: Colors.light['0'],
  },
  errorText: {
    color: Colors.error,
  },
  errorTextDark: {
    color: Colors.errorDark,
  },
  margin20: {
    marginBottom: -20,
  },
  phoneNumberInputContainerStyle: {
    marginBottom: -12,
  },
  countryCodeContainer: {
    backgroundColor: Colors.grey['ea'],
    flexDirection: 'row',
    columnGap: 8,
    marginRight: 4,
    alignItems: 'center',
    height: 57,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.grey['ea'],
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.grey['ea'],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.grey['ea'],
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  addImageContainer: {
    position: "relative",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary[500],
    borderRadius: 40,
  },
  account: {
color: "#ccc",
backgroundColor: Colors.grey['ea']
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalContent: {
    width: "100%",
  },

  content: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  roleCard: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#fff",
  },
  selectedRoleCard: {
    borderColor: Colors.primary["500"],
    borderWidth: 3,
    backgroundColor: Colors.primary["500"],
  },
  roleImageBackground: {
    flex: 1,
    justifyContent: "flex-end",
  },
  roleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  roleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
});
