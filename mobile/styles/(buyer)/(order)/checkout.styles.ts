import { Colors } from '@/constants';
import { Platform, StyleSheet } from 'react-native';

export const checkoutStyles = StyleSheet.create({
  notFoundContainer: {
    flexGrow: 1,
    marginBottom: 96,
  },
  orderContainer: {
    marginTop: 24,
  },
  orderDetailsContainer: {
    backgroundColor: Colors.light[10],
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    columnGap: 24,
  },
  rightContainer: {
    rowGap: 12,
  },
  productImage: {
    width: 102,
    height: 102,
    borderRadius: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.grey['fa'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: {
    color: Colors.primary[500],
    fontSize: 18,
  },
  greyText: {
    color: Colors.grey['61'],
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 16,
  },
  marginTop16: { marginTop: 16 },
  outterLocationIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary['50'],
  },
  innerLocationIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: Colors.primary['500'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowGap8: {
    rowGap: 8,
    flexShrink: 1,
  },
  textSmall: {
    fontSize: 14,
    color: Colors.grey['61'],
  },
  flexColumn: {
    flexDirection: 'column',
  },
  rowItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 22,
  },
  textAlignRight: {
    textAlign: 'right',
    fontSize: 16,
  },
  lastRowItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.grey['border'],
  },
  text16: {
    fontSize: 16,
  },
  quantityNativeInput: {
    width: 44,
    height: 28,
    marginVertical: 0,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === 'ios' ? 5 : 0,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.grey['fa'],
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.dark[0],
  },
  quantityNativeInputAndroid: {
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
});
