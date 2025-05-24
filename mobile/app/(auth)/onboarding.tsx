import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
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
  const { width } = useWindowDimensions();
  const router = useRouter();

  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleGetStarted = () => {
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, }}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {onboardingSlides.map((slide, index) => (
          <View
            key={slide.id}
            style={{ width, justifyContent: 'center', alignItems: 'center' }}
          >
            <View style={styles.imageContainer}>
              <Image
                source={slide.image}
                style={styles.image}
               
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.description}>{slide.description}</Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={styles.dotContainer}>
  {onboardingSlides.map((_, i) => {
    const animatedDotStyle = useAnimatedStyle(() => {
      const inputRange = [
        (i - 1) * width,
        i * width,
        (i + 1) * width,
      ];

      const scale = interpolate(
        scrollX.value,
        inputRange,
        [1, 1.6, 1],
        Extrapolate.CLAMP
      );

      const opacity = interpolate(
        scrollX.value,
        inputRange,
        [0.4, 1, 0.4],
        Extrapolate.CLAMP
      );

      return {
        transform: [{ scale }],
        opacity,
      };
    });

    return (
      <Animated.View
        key={i}
        style={[styles.dot, animatedDotStyle]}
      />
    );
  })}
</View>


      {/* Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleGetStarted} style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


