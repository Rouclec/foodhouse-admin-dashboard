import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, PanResponder, Animated, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import styles from '@/styles/(auth)/onboarding';


const onboardingSlides = [
  {
    id: 1,
    image: require("@/assets/images/rectangle16.png"),
    title: "Buy Fresh, Buy Cheap",
    description: "Enjoy farm-fresh product at affordable prices. By cutting out the middleman. We make it easy for you to buy directly from farmers and save on every purchase without compromising on quality",
  },
  {
    id: 2,
    image: require("@/assets/images/vegetable.png"),
    title: "Eat fresh, Grow strong",
    description: "Eat Fresh, Grow strong Fuel your body with the freshest ingredients. Our farmers provide nutrient-rich produce that help you stay healthy and strong, supporting a wholesome lifestyle for you and your family. Gets started",
  },
  {
    id: 3,
    image: require("@/assets/images/rectangle11.png"),
    title: "Eat healthy, Live Longer",
    description: "Prioritize your health with farm-to-table freshness. Our platform offers healthy, organic food options that promote a longer healthier life. Start your journey to better living today!",
  },
];

export default function OnboardingScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx > 50 && currentSlide > 0) {
          // Swipe right
          handlePrevious();
        } else if (gestureState.dx < -50 && currentSlide < onboardingSlides.length - 1) {
          // Swipe left
          handleNext();
        } else {
          // Reset position if not swiped enough
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false
          }).start();
        }
      },
    })
  ).current;

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      pan.setValue({ x: 0, y: 0 });
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      pan.setValue({ x: 0, y: 0 });
    }
  };

  const handleGetStarted = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
            <SafeAreaView style={styles.safeArea}>
      <View style={styles.topSection}>
        <Image 
          source={onboardingSlides[currentSlide].image} 
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{onboardingSlides[currentSlide].title}</Text>
          <Text style={styles.description}>{onboardingSlides[currentSlide].description}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.dotsContainer}>
            {onboardingSlides.map((_, index) => (
              <View 
                key={index}
                style={[
                  styles.dot,
                  index === currentSlide ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={currentSlide === onboardingSlides.length - 1 ? handleGetStarted : handleNext}
          >
            <Text style={styles.buttonText}>
              {currentSlide === onboardingSlides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
        </SafeAreaView>
        
        
     
    </View>
  );
}



