import React, { useRef, useState } from 'react';
import { View, useWindowDimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { defaultStyles, onboardingStyles } from '@/styles';
import { Text, Button } from 'react-native-paper';
import i18n from '@/i18n';
import { Colors } from '@/constants';
import { storeData } from '@/utils';
import { Image } from 'expo-image';

const onboardingSlides = [
  {
    id: 1,
    image: require('@/assets/images/onboarding1.jpg'),
    title: i18n.t('(auth).onboarding.1.title'),
    description: i18n.t('(auth).onboarding.1.description'),
  },
  {
    id: 2,
    image: require('@/assets/images/onboarding2.jpg'),
    title: i18n.t('(auth).onboarding.2.title'),
    description: i18n.t('(auth).onboarding.2.description'),
  },
  {
    id: 3,
    image: require('@/assets/images/onboarding3.png'),
    title: i18n.t('(auth).onboarding.3.title'),
    description: i18n.t('(auth).onboarding.3.description'),
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollX = useSharedValue(0);
  const scrollViewRef =
    useRef<React.ComponentRef<typeof Animated.ScrollView>>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / width);
      runOnJS(setCurrentSlide)(index);
    },
  });

  const handleNext = async () => {
    if (currentSlide < onboardingSlides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentSlide + 1),
        animated: true,
      });
    } else {
      await storeData('@hasOnboarded', true);
      router.replace('/login');
    }
  };

  const jumpToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({ x: width * index, animated: true });
    setCurrentSlide(index);
  };

  return (
    <View style={defaultStyles.flex}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ flexGrow: 1 }}>
        {onboardingSlides.map(slide => (
          <View
            key={slide.id}
            style={{ width, justifyContent: 'center', alignItems: 'center' }}>
            <View style={onboardingStyles.imageContainer}>
              <Image
                source={slide.image}
                style={onboardingStyles.image}
                placeholder={{
                  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                }} // Optional placeholder
                contentFit="cover"
                transition={1000}
              />
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

      <View style={defaultStyles.bottomContainerWithContent}>
        <View style={onboardingStyles.dotContainer}>
          {onboardingSlides.map((_, i) => {
            const animatedDotStyle = useAnimatedStyle(() => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const widthAnimated = interpolate(
                scrollX.value,
                inputRange,
                [10, 30, 10],
                Extrapolation.CLAMP,
              );
              const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.5, 1, 0.5],
                Extrapolation.CLAMP,
              );

              return {
                width: widthAnimated,
                opacity,
              };
            });

            return (
              <Pressable key={i} onPress={() => jumpToSlide(i)}>
                <Animated.View
                  style={[onboardingStyles.dot, animatedDotStyle]}
                />
              </Pressable>
            );
          })}
        </View>
        <View style={defaultStyles.bottomButtonContainer}>
          {currentSlide === onboardingSlides.length - 1 && (
            <Button
              mode="contained"
              buttonColor={Colors.primary['500']}
              onPress={handleNext}
              style={defaultStyles.button}>
              <Text style={defaultStyles.buttonText}>
                {i18n.t('(auth).onboarding.getStarted')}
              </Text>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
