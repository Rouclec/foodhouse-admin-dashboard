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
    backgroundColor: "#fff", 
    width: 120, 
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
    paddingVertical: 24,
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

  dialog: {
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

    infoContainer: {
      borderRadius: 12,
      marginBottom: 24,
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

  innerContainer: {
    padding: 20,
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    backgroundColor: Colors.primary[300],
    padding: 10,
    borderRadius: 30,
    marginRight: 15,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
  },

 icons: {
    backgroundColor: Colors.primary[300],
    padding: 5,
    borderRadius: 30,
    margin: 15,
  },
  content: {
    margin: 8,
    alignItems: "center",
  }

})