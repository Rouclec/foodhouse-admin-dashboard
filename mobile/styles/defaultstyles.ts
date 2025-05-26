import { Colors } from '@/constants';
import { Dimensions, Platform, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const defaultStyles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: Platform.OS === 'ios' ? 32 : 16,
    height: 64,
    width: width - 32,
  },
  bottomContainerWithContent: {
    paddingTop: 12,
    position: 'absolute',
    alignSelf: 'center',
    bottom: 0,
    paddingBottom: 32,
    width: width,
   
    paddingHorizontal: 16,
    rowGap: 12,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    
  },
  appHeader: {
    backgroundColor: Colors.primary['disabled'],
  },
  closeIconContainer: {
    width: 52,
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
  scrollContainer: {
    flexGrow: 1,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: Colors.light['10'],
    fontWeight: '600',
    fontSize: 16,
  },
  outlinedButton: {
    height: 56,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary['500'],
  },
  heading: {
    marginTop: 12,
    marginBottom: 10,
    fontWeight: 'bold',
    textAlign: 'left',
    color: Colors.primary[500],
  },
  allInput: {
    paddingTop: 12,
    gap: 34,
    paddingBottom: Platform.OS === 'ios' ? 0 : 120,
  },
  subheading: {
    marginBottom: 20,
    textAlign: 'left',
    width: '70%',
    color: Colors.grey['79'],
    fontSize: 12,
  },
  subheadingFull: {
    marginBottom: 20,
    textAlign: 'left',
    color: Colors.grey['79'],
    fontSize: 12,
  },
  iconContainer: {
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.grey['bg'],
    flexGrow: 1,
    height: 56,
    fontSize: 18,
    borderRadius: 4,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: Colors.primary['300'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorDark: {
    color: Colors.errorDark,
  },
  inputContentStyle: { alignItems: 'center', justifyContent: 'center' },
  snackbar: {
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.light['0'],
  },
  errorText: {
    color: Colors.error,
  },
  outlineInput: {
    borderWidth: 0.5,
    borderColor: Colors.primary['300'],
  },
});
