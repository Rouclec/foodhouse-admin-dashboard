import { StyleSheet, Dimensions } from "react-native";



const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    flex: 0.5,
    backgroundColor: '#D8FFC9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30
  },
  image: {
    width: width * 0.8,
    height: height * 0.8,
    borderRadius: 34,
  },
  bottomSection: {
    flex: 0.5,
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 20,
  },
  textContainer: {
    flex: 0.7,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  progressContainer: {
    flex: 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#6dcd47',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#6dcd47',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default styles;

