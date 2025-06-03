import { Colors } from "@/constants";
import { StyleSheet } from "react-native";
import { defaultStyles } from "../default.styles";

export const profileFlowStyles = StyleSheet.create({
    container: {
    ...defaultStyles.container,
    padding: 16,
  },
  vip: {
    flex: 1,
  },
heading: {
    textAlign: "center",
    color: "#ff0000",
},
  navigateSection: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 8,
    marginRight: 8,
  },

  sectionCard: {
    flexDirection: "row",
    backgroundColor: Colors.primary[500],
    borderRadius: 32,
    alignItems: "center",
    padding: 16,
    paddingTop: 24,
    paddingBottom: 24,
    marginLeft: 20,
    marginRight: 20
  },
  vipButton: {
    backgroundColor: "#fff", // White background for contrast
    width: 120, // Wider button
  },

  navigation: {
    flexDirection: "row",
  },
  buttonLabel: {
    color: Colors.primary[500],
  },
  logout: {
    color: "#ff0000",
  },

  navButton: {
    justifyContent: "flex-start",
    paddingVertical: 12,
  },
  navigationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  navigationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  navigationIcon: {
    width: 24,
    height: 24,
    marginRight: 16,
  },
  navigationText: {
    fontSize: 16,
  },
  divider: {
    marginHorizontal: -16,
  }, 

  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  dialog: {
    //backgroundColor: "transparent",
    bottom: 0,
    position: "absolute",
    left: 0,
    right: 0,
    rowGap: 4,
  },
  shareIcon: {
    width: 80,
    height: 80,
  },

  shareOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
   
  },
  shareOption: {
    width: '30%',
    alignItems: 'center',
    
  },
  shareOptionText: {
    marginTop: 5,
    fontSize: 12,
  },
  
  cancelButton: {
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmationModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  //personal info

    infoContainer: {
      borderRadius: 12,
      marginBottom: 24,
      marginHorizontal: 24,
    },
    infoItem: {
      paddingVertical: 4,
    },
    label: {
      fontSize: 14,
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    value: {
      fontSize: 16,
      marginBottom: 8,
      paddingVertical: 18,
      backgroundColor: Colors.grey["border"],
      borderRadius: 8,
      paddingHorizontal: 16,
    },
})