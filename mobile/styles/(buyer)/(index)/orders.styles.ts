import { Colors } from '@/constants';
import { StyleSheet } from 'react-native';

export const ordersStyles = StyleSheet.create({
  title: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    backgroundColor: Colors.light['bg'],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 48,
  },
  icon: {
    padding: 8,
  },
  closeIcon: {
    marginLeft: 12,
  },
  flatListContentContainer: {
    rowGap: 24,
  },
  tabItemsMainContainer: {
    width: '100%',
    marginVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabItemContainer: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: Colors.grey['border'],
  },
  tabItemActiveContainer: {
    borderBottomWidth: 4,
    borderBottomColor: Colors.primary[500],
  },
  tabItemText: { fontSize: 18, color: Colors.grey['9e'] },
  tabItemActiveText: { color: Colors.primary[500] },
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  orderDetailsContainer: {
    flexShrink: 1,
    flexGrow: 1,
    overflow: 'hidden',
    rowGap: 8,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryText: { fontSize: 16, color: Colors.primary[500] },
  ratingTitleContainer: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderColor: Colors.grey['border'],
  },
  ratingTitle: { fontSize: 24, lineHeight: 32 },
  ratingsButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 24,
    paddingVertical: 24,
  },
  halfButton: {
    width: '45%',
  },
  ratingSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderColor: Colors.grey['border'],
  },
  ratingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingSectionSubtitle: {
    fontSize: 14,
    color: Colors.grey['61'],
    marginBottom: 16,
    textAlign: 'center',
  },
  agentRatingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.grey['e1'],
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.grey['fa'],
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
  },
});
