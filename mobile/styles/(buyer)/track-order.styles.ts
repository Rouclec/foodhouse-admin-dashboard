import { Colors } from '@/constants';
import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');
export const trackOrderStyles = StyleSheet.create({
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
  flatListContainer: {
    marginVertical: 12,
    height: 64,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatListIconContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    rowGap: 6,
  },
  relativeContainer: {
    position: 'relative',
  },
  dashedConnector: {
    position: 'absolute',
    left: 24,
    top: 10,
    width: 52,
    height: 1,
    borderStyle: 'dashed', // or "dashed"
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  divider: {
    height: 1,
    borderTopWidth: 1,
    borderColor: Colors.grey['border'],
    marginVertical: 16,
  },
  contentContainer: {
    paddingTop: 8,
    // paddingVertical: 24,
    rowGap: 24,
  },
  filterLogsContainer: {
    position: 'relative',
    flexDirection: 'row',
    columnGap: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  filterLogConentContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
    columnGap: 12,
  },
  verticalDivider: {
    position: 'absolute',
    height: 64,
    borderStyle: 'dashed',
    borderWidth: 1,
    width: 1,
    borderColor: Colors.grey['bd'],
    left: 8,
    top: 28,
  },
  columnGap: {
    gap: 10,
    flex: 1,
  },
  rowGap6: {
    rowGap: 6,
    maxWidth: width * 0.6,
    flexShrink: 1,
    flex: 1,
  },
  bodyText: {
    fontSize: 14,
    color: Colors.grey['61'],
    flexShrink: 1,
    overflow: 'hidden',
  },
  timeText: {
    textAlign: 'right',
    fontSize: 12,
    color: Colors.grey['61'],
    flexShrink: 0,
  },
  leftText: {
    flexShrink: 1,
    fontSize: 14,
    color: Colors.grey['61'],
  },
  rightText: { flexShrink: 1, textAlign: 'right', fontSize: 16 },
  text20: {
    fontSize: 20,
  },
  padding: {
    padding: 8,
  },
});
