// import { Colors } from '@/constants';
import { Colors } from '@/constants';
import { StyleSheet } from 'react-native';

export const phoneNumberInputStyles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    columnGap: 8,
  },
  countryCodeContainer: {
    backgroundColor: Colors.grey['ea'],
    flexDirection: 'row',
    columnGap: 8,
    marginRight: 4,
    alignItems: 'center',
    height: 57,
    justifyContent: 'center',
    padding: 16,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.primary['300'],
  },
  countryCodeText: {
    fontSize: 14,
    color: Colors.grey['surface'],
  },
  divider: {
    height: '100%',
    width: 2,
    // backgroundColor: Colors.grey[20],
  },
  errorInput: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  focusedMode: {
    borderWidth: 2,
    // borderColor: Colors.grey['79'],
  },
  input: {
    backgroundColor: Colors.grey['ea'],
    flexGrow: 1,
    height: 56,
    fontSize: 16,
    borderRadius: 4,
    paddingHorizontal: 16,
    bottom: 6,
    marginLeft: 20,
  },
  outlineInput: {
    borderWidth: 0.5,
    borderColor: Colors.primary['300'],
  },
  searchInput: {
    backgroundColor: 'transparent',
    flexGrow: 1,
    height: 48,
    fontSize: 18,
    color: Colors.dark[0],
  },
  backgroundDark: {
    backgroundColor: Colors.light[0],
    flex: 1,
  },
  modalContainer: {
    padding: 24,
    rowGap: 16,
  },
  searchcontainer: {
    flexDirection: 'row',
    columnGap: 8,
    marginRight: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
  },
  countryItem: {
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey['3c'],
  },
  texts: {
    flexDirection: 'row',
    columnGap: 8,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  countryName: {
    fontSize: 18,
    color: Colors.dark[0],
  },
  countryContainer: {
    //backgroundColor: Colors.grey['e1'],
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    height: 64,
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 4,
  },
  flexContainer: {
    flexDirection: 'row',
    columnGap: 16,
  },
});
