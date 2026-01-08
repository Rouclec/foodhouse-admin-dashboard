import Colors from '@/constants/Colors';
import { StyleSheet } from 'react-native';

export const summaryStyles = StyleSheet.create({
  appHeader: {
    backgroundColor: Colors.light[10],
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
    padding: 16,
    paddingBottom: 100,
  },
  packageCard: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light[10],
    marginBottom: 12,
  },
  packageDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  packageDetailText: {
    fontSize: 14,
    color: Colors.light[10],
  },
  packageDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light[10],
  },
  deliverySection: {
    backgroundColor: Colors.light[10],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.grey.e5,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark[10],
  },
  deliveryTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary[500],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark[10],
    marginBottom: 2,
  },
  itemUnit: {
    fontSize: 12,
    color: Colors.grey[61],
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark[10],
  },
  paymentSection: {
    backgroundColor: Colors.light[10],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.grey.e5,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark[10],
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.grey[61],
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark[10],
  },
  paymentValueFree: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary[500],
  },
  paymentValueDiscount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary[500],
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey.e5,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark[10],
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary[500],
  },
  footer: {
    backgroundColor: Colors.light[10],
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.grey.e5,
  },
  confirmButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
  },
  confirmButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
