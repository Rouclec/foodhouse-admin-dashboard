import { Colors } from '@/constants';
import { Dimensions, StyleSheet } from 'react-native';
const screenWidth = Dimensions.get('window').width;


const { width } = Dimensions.get('window');
export const buyerProductsStyles = StyleSheet.create({
  bgWhite: {
    backgroundColor: Colors.light['bg'],
  },
  appHeader: {
    backgroundColor: Colors.primary[500],
    width,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    width: '100%',
  },
  appHeaderContent: {
    rowGap: 24,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appHeaderTopContainer: {
    paddingTop: 12,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticiatonIndicator: {
    position: 'absolute',
    backgroundColor: Colors.primary[500],
    width: 8,
    height: 8,
    borderRadius: 8,
    top: 3,
    right: 3,
  },
  appHeaderLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  iconContainer: {
    height: 48,
    width: 48,
    borderRadius: 48,
    backgroundColor: Colors.light[10],
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 46,
  },
  avatarImage: {
    width: 28,
    height: 28,
  },
  backButtonContainer: {
    alignItems: 'flex-end',
  },
  heading: {
    marginLeft: 0,
  },
  title: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: 'bold',
  },
  marginHorizontal24: {
    marginHorizontal: 24,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    width: '100%',
    marginHorizontal: 24,
    height: 56,
    paddingHorizontal: 0,
    borderRadius: 16,
  },
  searchInputOutline: {
    borderWidth: 0,
    borderColor: Colors.light[10],
  },
  icon: {
    padding: 8,
  },
  closeIcon: {
    marginLeft: 12,
  },
  flatListContentContainer: {
    rowGap: 24,
    padding: 24,
  },
  flatListColumnWrapper: {
    columnGap: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addProductButton: {
    position: 'absolute',
    right: 24,
    backgroundColor: Colors.primary[500],
    width: 64,
    height: 64,
    borderRadius: 64,
    bottom: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingsText: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.light['10.87'],
  },
  nameText: {
    color: Colors.light[10],
    fontSize: 20,
    lineHeight: 24,
  },
  horizontalFlatList: {
    paddingVertical: 12,
    flex: 1,
  },

  horizontailFlatListContent: {
    columnGap: 32,
    alignItems: 'flex-start',
    height: '100%',
  },
  paddingRight24: {
    paddingRight: 24,
  },
  paddingLeft24: {
    paddingLeft: 24,
  },
  categoryItem: {
    flexDirection: 'row',
    columnGap: 4,
    height: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.grey['f8'],
    borderRadius: 100,
  },
  selectedCategoryItem: {
    backgroundColor: Colors.primary[500],
  },
  flatListContainer: {
    height: 64,
  },
  filtersContainer: {
    height: '100%',
    alignItems: 'center',
    paddingBottom: 24,
  },
  mainFilterContainer: {
    marginVertical: 24,
    paddingBottom: 24,
    flexGrow: 1,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: Colors.grey['border'],
  },
  halfButton: {
    width: '45%',
  },
  bottomButtonContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  silderContainer: {
    // alignItems: "center",
    marginLeft: 16,
  },
  sliderTrack: {
    width: '100%',
    height: 8,
    borderRadius: 20,
  },
  sliderSelectedStyle: { backgroundColor: Colors.primary[500] },
  marker: {
    width: 28,
    height: 28,
    borderRadius: 28,
    backgroundColor: Colors.light[10],
    borderWidth: 6,
    borderColor: Colors.primary[500],
    marginTop: 8,
  },

  tooltipContainer: {
    position: 'absolute',
    top: -20,
    right: -16,
  },
  tooltip: {
    backgroundColor: Colors.primary[500],
    padding: 1,
    borderRadius: 2,
    width: 56,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipText: {
    color: 'white',
    fontSize: 14,
    flexShrink: 1,
    overflow: 'hidden',
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -4, // position below the tooltip box
    left: '50%',
    marginLeft: -4, // half of border width to center it
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary[500],
  },
  ratingText: {
    fontSize: 16,
  },

  subscriptionContainer: {
    
    
    margin:  8,
    rowGap: 12,
    paddingBottom: 8,
  },
  package: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    justifyContent: 'space-between',
    alignItems: 'center',

    // marginBottom: 8,
  },
 scrollViewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    //paddingHorizontal: 10,
  },
  packageContainer: {
    width: screenWidth * 0.60,
    backgroundColor: Colors.grey['200'],
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 8,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.secondary['100']
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  discountBadge: {
    backgroundColor: Colors.primary['500'],
    borderRadius: 24,
    height: 26,
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },

  discountText: {
    fontSize: 12,
    color: Colors.light['10'],
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Aligns content to opposite sides
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 5,
    fontSize: 14,
  },
  amountText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  title1: {
    marginTop: 18,
    fontSize: 16,
    color: Colors.primary['500'],
    marginRight: 8,
  },
});
