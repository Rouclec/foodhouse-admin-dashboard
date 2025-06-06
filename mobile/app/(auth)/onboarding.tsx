import React from "react";
import {
  View,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { onboardingStyles } from "@/styles";
import { Text } from "react-native-paper";
import i18n from "@/i18n";

const onboardingSlides = [
  {
    id: 1,
    image: require("@/assets/images/onboarding1.jpg"),
    title: i18n.t("(auth).onboarding.1.title"),
    description: i18n.t("(auth).onboarding.1.description"),
  },
  {
    id: 2,
    image: require("@/assets/images/onboarding2.jpg"),
    title: i18n.t("(auth).onboarding.2.title"),
    description: i18n.t("(auth).onboarding.2.description"),
  },
  {
    id: 3,
    image: require("@/assets/images/onboarding3.png"),
    title: i18n.t("(auth).onboarding.3.title"),
    description: i18n.t("(auth).onboarding.3.description"),
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
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {onboardingSlides.map((slide) => (
          <View
            key={slide.id}
            style={{ width, justifyContent: "center", alignItems: "center" }}
          >
            <View style={onboardingStyles.imageContainer}>
              <Image source={slide.image} style={onboardingStyles.image} />
            </View>
            <View style={onboardingStyles.textContainer}>
              <Text style={onboardingStyles.title}>{slide.title}</Text>
              <Text style={onboardingStyles.description}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      <View style={onboardingStyles.dotContainer}>
        {onboardingSlides.map((_, i) => {
          const animatedDotStyle = useAnimatedStyle(() => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

            const widthAnimated = interpolate(
              scrollX.value,
              inputRange,
              [10, 30, 10],
              Extrapolation.CLAMP
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.5, 1, 0.5],
              Extrapolation.CLAMP
            );

            return {
              width: widthAnimated,
              opacity,
            };
          });

          return (
            <Animated.View
              key={i}
              style={[onboardingStyles.dot, animatedDotStyle]}
            />
          );
        })}
      </View>

      {/* Button */}
      <View style={onboardingStyles.buttonContainer}>
        <TouchableOpacity
          onPress={handleGetStarted}
          style={onboardingStyles.button}
        >
          <Text style={onboardingStyles.buttonText}>{i18n.t("(auth).onboarding.getStarted")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
