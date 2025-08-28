import { Colors } from '@/constants';
import { Dimensions, StyleSheet } from 'react-native';

const { height } = Dimensions.get('window');
export const productDetailsStyles = StyleSheet.create({
  imageBackground: {
    height: height * 0.4,
    padding: 24,
  },
  bgTransparent: {
    backgroundColor: 'tranparent',
  },
  contentContainer: {
    padding: 24,
    rowGap: 24,
  },
  productName: {
    fontSize: 32,
    lineHeight: 40,
  },
  rowGap12: {
    rowGap: 12,
  },
  justifyText: {
    textAlign: 'justify',
  },
  farmerDetailscontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 20,
  },
  farmerProfileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.grey['bg'],
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 56,
  },
  avatar: {
    width: 36,
    height: 36,
  },
  farmerName: {
    fontSize: 18,
  },
  nameAndCheckContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    rowGap: 6,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 56,
  },
  halfContainer: {
    width: '45%',
  },
  priceContainer: {
    rowGap: 6,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.grey['75'],
  },
  price: {
    color: Colors.primary[500],
    fontSize: 24,
    flexWrap: 'wrap',
  },
  greyText: {
    color: Colors.grey['61'],
  },
  locationText: {
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
  },
});
