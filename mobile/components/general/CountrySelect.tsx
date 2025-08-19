import React, {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  StyleProp,
  TouchableOpacity,
  View,
  ViewStyle,
  Text,
  Animated,
  LayoutChangeEvent,
  Easing,
  TextStyle,
} from 'react-native';

import { Colors, countries as allCountries } from '@/constants';
import { Country } from '@/interface';
import { phoneNumberInputStyles as styles } from '@/styles';
import { Icon } from 'react-native-paper';
import { CountryList } from './CountryList';

interface Props {
  containerStyle?: StyleProp<ViewStyle>;
  textContainerStyles?: StyleProp<ViewStyle>;
  setCountry: Dispatch<SetStateAction<Country>>;
  country: Country;
  countries?: Country[] | undefined;
  activeColor?: string;
  iconColor?: string;
  labelColor?: string;
  valueTextStyle?: TextStyle;
  labelTextStyle?: TextStyle;
}

export const CountrySelect: FC<Props> = ({
  setCountry,
  containerStyle,
  countries = allCountries,
  activeColor = Colors.primary[500],
  iconColor = Colors.dark[0],
  labelColor = Colors.grey['61'],
  country,
  valueTextStyle,
  labelTextStyle,
}) => {
  const [showCountries, setShowCountries] = useState(false);

  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [inputHeight, setInputHeight] = useState(0);

  const onInputLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setInputHeight(height);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isFocused || !!country ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(rotateAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFocused, country]);

  const labelTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -inputHeight / 2], // shift slightly lower when unfocused, fully up when focused
  });

  const labelTranslateX = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [8, -8], // Placeholder position → Label position
  });

  const labelScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={containerStyle} testID="country-select-component">
      <View style={styles.mainContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onLayout={onInputLayout}
          onPress={() => setShowCountries(true)}
          style={[
            styles.inputContainer,
            containerStyle,
            isFocused && { borderColor: activeColor, borderWidth: 2 },
          ]}>
          {/* <Animated.Text
            style={[
              styles.label,
              {
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                  { translateX: labelTranslateX },
                ],
                color: isFocused ? activeColor : labelColor,
              },
              labelTextStyle,
            ]}
          >
            Country
          </Animated.Text> */}
          <View style={[styles.flexSmallContainer, styles.fullContainer]}>
            <Text style={[styles.countryCodeText, valueTextStyle]}>
              {country?.emoji}
            </Text>
            <Text style={[styles.countryCodeText, valueTextStyle]}>
              {country?.name}
            </Text>
          </View>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icon color={iconColor} size={24} source={'chevron-down'} />
          </Animated.View>
        </TouchableOpacity>
      </View>
      <CountryList
        visible={showCountries}
        setVisible={setShowCountries}
        setCountry={setCountry}
        countries={countries}
      />
    </View>
  );
};
