import Colors from "@/constants/Colors";
import { StyleSheet } from "react-native";

export const selectionSubscriptionStyles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "75%",
  },
  scrollContainer: {
    paddingBottom: 120,
  },
  contentContainer: {
    top: "20%",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerContainer: {
    top: 32,
    alignItems: "center",
  },
  mainTitle: {
    marginTop: 4,
    marginBottom: 10,
    textAlign: "left",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 32,
    color: "#fff",
  },

   heading: {
    marginBottom: 10,
    
    fontSize: 20,
    fontWeight: "300",
    lineHeight: 22,
   
  },

  subTitle: {
    textAlign: "left",
    color: "#fff",
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 24,
    letterSpacing: 0.5,
    marginLeft: 10,
  },
  benefitsContainer: {
    marginTop: 34,
    paddingHorizontal: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
    marginTop: 6,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
  },
  plansContainer: {
    marginTop: 38,
  },
  planCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 15,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  selectedPlanCard: {
    borderColor: Colors.primary[500],
  },
  planSelector: {
    marginRight: 12,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
  },

  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary[500],
  },
  planDetails: {
    flex: 1,
  },
  planDuration: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: Colors.grey.e7,
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
  },
  planPriceContainer: {
    marginLeft: 12,
    flexDirection: "row",

    height: 40,
    top: 4,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  priceValue: {
    top: 5,
    fontWeight: "800",
  },
  priceDuration: {
    fontSize: 12,
    top: 9,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
  },
  skipButton: {
    marginRight: 8,
    backgroundColor: "#fff",
    borderColor: Colors.primary[500],
  },
  subscribeButton: {
    backgroundColor: Colors.primary[500],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
   methodIcon: {
    width: 40,
    height: 40,
    marginRight: 16,
    resizeMode: "contain",
    
  },
   methodCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  languageItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
});
