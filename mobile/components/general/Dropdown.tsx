import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  LayoutChangeEvent,
  ScrollView,
} from "react-native";
import { Colors } from "@/constants";
import { dropdownStyles as styles } from "@/styles";
import { Icon } from "react-native-paper";

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  label: string;
  data: DropdownItem[];
  value: string | undefined;
  onSelect: (item: string) => void;
  dropdownStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  iconColor?: string;
  activeColor?: string;
  labelColor?: string;
  valueTextStyle?: TextStyle;
  labelTextStyle?: TextStyle;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  data = [],
  value,
  onSelect,
  dropdownStyle,
  inputContainerStyle,
  activeColor = Colors.primary[500],
  iconColor = Colors.dark[0],
  labelColor = Colors.grey["61"],
  valueTextStyle,
  labelTextStyle,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [inputHeight, setInputHeight] = useState(0);
  const [selectedValue, setSelectedValue] = useState<DropdownItem>();

  const onInputLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setInputHeight(height);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(rotateAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isFocused, value]);

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
    outputRange: ["0deg", "180deg"],
  });

  const toggleDropdown = () => setIsFocused((prev) => !prev);

  const handleSelect = (item: DropdownItem) => {
    onSelect(item.value);
    setIsFocused(false);
    setSelectedValue(item);
  };

  return (
    <View
    // style={{ marginTop: 30 }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleDropdown}
        onLayout={onInputLayout}
        style={[
          styles.inputContainer,
          inputContainerStyle,
          isFocused && { borderColor: activeColor, borderWidth: 2 },
        ]}
      >
        <Animated.Text
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
          {label}
        </Animated.Text>
        <Text style={[styles.valueText, valueTextStyle]}>
          {selectedValue?.label ?? ""}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon color={iconColor} size={24} source={"chevron-down"} />
        </Animated.View>
      </TouchableOpacity>

      {isFocused && (
        <View style={[styles.dropdown, dropdownStyle]}>
          <ScrollView>
            {data.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.item,
                  index === data?.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={() => handleSelect(item)}
              >
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};
