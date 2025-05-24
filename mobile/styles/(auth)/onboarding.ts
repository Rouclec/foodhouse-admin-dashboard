import { StyleSheet, Dimensions } from "react-native";


// const DOT_SIZE = 10;


export const onboardingStyles = StyleSheet.create({
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#D8FFC9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  image: {
    width: '90%',
    height: '80%',
    borderRadius: 20,
    marginTop: 20,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 20,
    lineHeight: 26,
    color: '#616161',
    paddingHorizontal: 10,
    fontFamily: "urbanist",
  },
  dotContainer: {
    position: 'absolute',
    bottom: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 10,
  },
  dot: {
  height: 10,
  borderRadius: 5,
  backgroundColor: '#6dcd47',
  marginHorizontal: 5,
},

  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#6dcd47',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '80%',
    height: 58,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});



