import { Colors } from '@/constants';
import { Platform, StyleSheet } from 'react-native';

export const signupStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.primary['disabled'],
  },
  appHeader: {
    backgroundColor: Colors.primary['disabled'],
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
  },
  heading: {
    marginTop: 4,
    marginBottom: 10,
    textAlign: 'left',
    fontSize: 24,
    fontWeight: 600,
    lineHeight: 32,
    color: Colors.primary[500],
  },
  scrollContainer: {
    flexGrow: 1,
    marginTop: 12,
  },
  allInput: {
    
    gap: 34,
    paddingBottom: Platform.OS === 'ios' ? 0 : 120,
  },
  subheading: {
    textAlign: 'left',
    width: '100%',
    color: Colors.grey['79'],
    fontSize: 12,
    lineHeight: 16,
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
    backgroundColor: Colors.grey['bg'],
    flexGrow: 1,
    height: 56,
    fontSize: 14,
    borderRadius: 4,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: 'transparent',
    color: Colors.grey['surface'],
  },
  outlineInput: {
    borderWidth: 0.5,
    borderColor: Colors.primary['300'],
  },
  focusedInput: {
    backgroundColor: Colors.grey['ea'],
    flexGrow: 1,
    height: 64,
    fontSize: 18,
    borderRadius: 4,
    paddingHorizontal: 16,
    borderColor: Colors.primary['300'],
    borderWidth: 2,
    color: Colors.grey['ea'],
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
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.primary['300'],
  },
});
