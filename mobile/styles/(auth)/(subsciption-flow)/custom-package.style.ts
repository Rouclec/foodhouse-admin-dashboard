import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';

export const customPackageStyles = StyleSheet.create({
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 24,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 100,
    marginHorizontal: 8,
  },
  headerCard: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    rowGap: 16,
  },
  headerCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light[10],
    marginBottom: 8,
  },
  headerCardSubtitle: {
    fontSize: 14,
    color: Colors.light[10],
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
    // backgroundColor: Colors.light[10],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey.e5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[10],
    marginBottom: 12,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 12,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.grey.f8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonGreen: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',

    paddingVertical: 8,
  },
  valueText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.dark[10],
  },
  valueSubtext: {
    fontSize: 14,
    color: Colors.grey[61],
  },
  sliderContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.grey.e5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 4,
  },
  pricePerDelivery: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderColor: Colors.primary[500],
    borderWidth: 1,
  },
  pricePerDeliveryText: {
    fontSize: 14,
    color: Colors.primary[500],
    fontWeight: '600',
  },
  summarySection: {
    // backgroundColor: Colors.light[10],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey.e5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.grey[61],
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.dark[10],
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey.e5,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary[500],
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
});
