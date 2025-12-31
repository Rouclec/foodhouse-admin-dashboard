import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';

export const selectionSubscriptionStyles = StyleSheet.create({
  container: {
    // flex: 1,
    // gap: 32,
    // paddingHorizontal: 24,
    // paddingTop: 16,
    backgroundColor: 'white',
  },

  // header: {
  //   backgroundColor: Colors.primary[500],
  //   paddingHorizontal: 24,
  //   paddingTop: 16,
  //   paddingBottom: 38,
  //    height: '40%',

  // },
  headerContent: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 28,
    position: 'relative',
    minHeight: 200,
  },
  headerTextContainer: {
    zIndex: 1,
    paddingRight: 100,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,

    color: Colors.light[10],
    marginBottom: 8,
    lineHeight: 38,
    marginTop: 18,

    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.light[10],
    lineHeight: 24,
  },
  headerImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 250,
    height: 280,
  },
  scrollView: {
    flex: 1,
    // backgroundColor: Colors.light[10],
  },
  iconContainer: {
    backgroundColor: Colors.secondary['200'],
    height: 56,
    width: 56,
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconContainer1: {
    backgroundColor: Colors.secondary['100'],
    height: 24,
    width: 24,
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
    marginHorizontal: 8,
  },
  customizeCard: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  customizeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customizeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  customizeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light[10],
    marginBottom: 4,
  },
  customizeSubtitle: {
    fontSize: 16,
    color: Colors.light[10],
    lineHeight: 24,
  },
  customizeButton: {
    backgroundColor: Colors.light[10],
    borderRadius: 100,
  },
  customizeButtonLabel: {
    color: Colors.primary[500],
    fontSize: 14,
    fontWeight: '600',
  },
  plansSection: {
    marginTop: 8,
  },
  plansTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: 'bold',
  },
  plansSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: Colors.grey['200'],
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.secondary['100'],
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  planHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planDuration: {
    fontSize: 14,
    fontWeight: '500',
  },
  planBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 24,
    height: 26,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  planBadgeText: {
    fontSize: 12,
    color: Colors.light[10],
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  planDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planDetailText: {
    marginLeft: 5,
    fontSize: 14,
  },
  planPrice: {
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.primary[500],
  },
  planPricePerMonth: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light[10],
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.grey.e5,
  },
  continueButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
  },
  continueButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  plansContainer: {
    gap: 12,
    paddingVertical: 8,
  },

  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F7F7FB',
  },

  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, 
  },

  planSelector: {
    marginLeft: 'auto', 
    justifyContent: 'center',
    alignItems: 'center',
  },

  methodIcon: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginRight: 12,
  },

  selectionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C5C5D6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  innerCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5B4FFF',
  },

  /* Optional: apply when selected */
  selectedCard: {
    backgroundColor: '#F0EEFF',
    borderColor: '#5B4FFF',
  },
});
