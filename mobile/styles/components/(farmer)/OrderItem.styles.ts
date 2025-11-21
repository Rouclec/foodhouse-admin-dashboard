import { Colors } from '@/constants';
import { StyleSheet } from 'react-native';

export const orderItemStyles = StyleSheet.create({
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  orderDetailsContainer: {
    flexShrink: 1,
    flexGrow: 1,
    overflow: 'hidden',
    rowGap: 4,
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryText: { fontSize: 16, color: Colors.primary[500] },
});
