import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';

export const verifyOtpStyles = StyleSheet.create({
sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "white",
  },
  outlineInput: {
    borderRadius: 8,
    borderWidth: 1,
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 10,

    paddingVertical: 4,

    height: 50,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.primary[500],
    color: "fff",
  },
  skipButton: {
    borderColor: "#e8e8e8",
    backgroundColor: Colors.primary[300],
  },
  skipButtonText: {
    color: "black",
  },
  imageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  imageUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
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
    backgroundColor: "#3f51b5",
    borderRadius: 12,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButton: {
    marginVertical: 8,
  },
   successModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  successModalContent: {
    width: '100%',
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  successButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  successButton: {
    flex: 1,
    marginHorizontal: 8,
  },
})