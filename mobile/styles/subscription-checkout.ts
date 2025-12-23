import { StyleSheet } from 'react-native';
import { Colors } from '@/constants';

export const subscriptionCheckoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light[10],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.light[10],
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey['f8'],
  },
  headerTitle: {
    marginLeft: 16,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: Colors.light[10],
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[10],
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  planBadgeText: {
    color: Colors.light[10],
    fontSize: 12,
    fontWeight: '600',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[10],
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  planDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  planDetailText: {
    marginLeft: 8,
    color: Colors.dark[10],
    fontSize: 14,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.grey['f8'],
    borderRadius: 8,
    padding: 12,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressText: {
    flex: 1,
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  addressSubtitle: {
    fontSize: 12,
    color: Colors.grey[500],
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.dark[10],
  },
  summaryValue: {
    fontSize: 14,
    color: Colors.dark[10],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grey['f8'],
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark[10],
  },
  deliveryNote: {
    backgroundColor: Colors.primary[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  deliveryNoteText: {
    fontSize: 12,
    color: Colors.primary[700],
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    marginTop: 16,
  },
  confirmButtonLabel: {
    color: Colors.light[10],
    fontSize: 16,
    fontWeight: '600',
  },
});