import { Colors } from '@/constants';
import { StyleSheet } from 'react-native';
import { defaultStyles } from '../default.styles';

export const agentHomeStyles = StyleSheet.create({
  ...defaultStyles,
  container: {
    flex: 1,
    backgroundColor: Colors.light['bg'],
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 20,
    backgroundColor: Colors.primary[500],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 48,
    fontWeight: '700',
    color: Colors.light[10],
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: Colors.light[10],
    fontWeight: '500',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ADE80',
  },
  offlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.error,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light[10],
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.grey['fa'],
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.grey['e1'],
  },
  tabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: Colors.primary[500],
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.grey['61'],
  },
  tabTextActive: {
    color: Colors.light[10],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  ordersList: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: Colors.light[10],
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark[10],
  },
  orderDistance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    color: Colors.grey['61'],
  },
  orderRoute: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDestinationIcon: {
    backgroundColor: Colors.success + '20',
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: Colors.grey['61'],
    marginBottom: 2,
  },
  routeAddress: {
    fontSize: 14,
    color: Colors.dark[10],
    fontWeight: '500',
  },
  routeConnector: {
    width: 2,
    height: 20,
    backgroundColor: Colors.grey.e1,
    marginLeft: 15,
    marginVertical: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grey.e1,
  },
  earningContainer: {
    alignItems: 'flex-start',
  },
  earningLabel: {
    fontSize: 12,
    color: Colors.grey['61'],
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary[500],
  },
  acceptButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: Colors.light[10],
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.grey.e1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark[10],
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.grey['61'],
    textAlign: 'center',
  },
});
