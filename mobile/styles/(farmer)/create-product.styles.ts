import { Colors } from "@/constants";
import { StyleSheet } from "react-native";

export const createProductStyles = StyleSheet.create({
  flexButtonContainer: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 12,
  },
  textArea: {
    height: 112,
  },
  inputsContainer: {
    rowGap: 24,
  },
  button: {
    width: "50%",
  },
  addImageTitle: {
    fontSize: 16,
  },
  addImageContainer: {
    rowGap: 12,
  },
  addIcon: {
    width: 64,
    height: 64,
    borderRadius: 64,
    backgroundColor: Colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary[50],
    width: "100%",
    height: 204,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    borderStyle: "dashed",
    rowGap: 20,
    padding: 12,
  },
  image: {
    width: "100%",
    height: 186,
    borderRadius: 8,
  },
  deleteImageButton: {
    position: "absolute",
    zIndex: 99,
    backgroundColor: Colors.dark[0.8],
    right: 8,
    top: 8,
    borderRadius: 4,
    height: 28,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    height: 186,
    position: "relative",
  },
  uploadImageText: {
    paddingHorizontal: 52,
    fontSize: 14,
    textAlign: "center",
  },

      inputLabel: {
        fontSize: 12,
        //color: Colors.grey[700],
        marginBottom: 4,
      },
      inputValue: {
        fontSize: 16,
        //color: Colors.grey[900],
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: Colors.grey['bg'],
        borderRadius: 10,
        backgroundColor: Colors.grey['fa'],
        minHeight: 56,
        justifyContent: 'center',
      },
      inputContainer: {
        marginBottom: 16,
      },
      textAreaValue: {
        minHeight: 120,
        paddingTop: 12,
        paddingBottom: 12,
        textAlignVertical: 'top',
      },
      editableField: {
        borderColor: Colors.primary[500],
        borderWidth: 1,
      }
    
});
