import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';

export const verifyOtpStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appHeader: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  headingTextContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 60,
  },
  appHeaderIconContainer: {
    backgroundColor: Colors.grey['ea'],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    height: 40,
    width: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.grey['border'],
  },
  headingText: {
    textAlign: 'center',
    fontSize: 18,
  },
  subHeadingText: {
    color: Colors.grey['surface'],
    fontSize: 18,
    lineHeight: 20,
    fontWeight: 400,
  },
  scrollView: { marginTop: 16 },
  otpContainer: { rowGap: 10, height: 88 },
  otpBoxStyle: {
    backgroundColor: Colors.grey['bg'],
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 60,
    minWidth: 48,
    color: Colors.grey['surface'],
  },
  resendTextStyle: {
    color: Colors.grey['surface'],
  },
  text: {
    color: Colors.dark[0],
  },
  link: {
    color: Colors.primary['500'],
  },
  button: {
    height: 58,
    justifyContent: 'center',
    borderRadius: 16,
    width: '100%',
  },
  dialogContainer: {
    backgroundColor: Colors.grey['e15'],
    padding: 28,
    rowGap: 16,
    borderWidth: 1,
    borderColor: Colors.primary['300'],
  },
  dialogTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'avenir-700',
    color: Colors.primary['500'],
  },
  dialogContent: {
    textAlign: 'center',
    color: Colors.grey['surface'],
    fontSize: 14,
  },
  dialogActionContainer: { alignItems: 'center', justifyContent: 'center' },
  dialogActionButton: {
    height: 50,
    justifyContent: 'center',
    borderRadius: 16,
    width: '100%',
    backgroundColor: Colors.primary['500'],
  },
  resendTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  snackbar: {
    borderWidth: 1,
    borderColor: Colors.error,
    backgroundColor: Colors.light['0'],
  },
  errorText: {
    color: Colors.error,
  },

  backArrow: {
    color: Colors.dark['0'],
    backgroundColor: Colors.grey['ea'],
    borderColor: Colors.grey['e14'],
    borderRadius: 12,
    borderWidth: 1,
    height: 40,
    width: 40,
  },
});
