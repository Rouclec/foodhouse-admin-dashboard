import React, { useEffect, useRef, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants';
import { defaultStyles, dropdownStyles as styles } from '@/styles';
import { HelperText, Icon, Portal } from 'react-native-paper';
import i18n from '@/i18n';

interface DropdownItem {
  label: string;
  value: string;
}

interface DropdownProps {
  data: DropdownItem[];
  value: string | undefined;
  onSelect: (item: string) => void;
  dropdownStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  label?: string;
  iconColor?: string;
  activeColor?: string;
  labelColor?: string;
  valueTextStyle?: TextStyle;
  labelTextStyle?: TextStyle;
  loading?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  defaultSelected?: DropdownItem;
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
  labelColor = Colors.grey['61'],
  valueTextStyle,
  labelTextStyle,
  loading = false,
  onFocus = () => {},
  onBlur = () => {},
  error,
  defaultSelected,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [inputHeight, setInputHeight] = useState(0);
  const [selectedValue, setSelectedValue] = useState<DropdownItem>();

  const inputRef = useRef<View>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const DROPDOWN_OFFSET = 24;

  const onInputLayout = () => {
    inputRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownPosition({ x, y, width, height });
    });
  };

  // const onInputLayout = (event: LayoutChangeEvent) => {
  //   const { height } = event.nativeEvent.layout;
  //   setInputHeight(height);
  // };

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
    outputRange: ['0deg', '180deg'],
  });

  const toggleDropdown = () => setIsFocused(prev => !prev);

  useEffect(() => {
    isFocused ? onFocus?.() : onBlur?.();
  }, [isFocused]);

  const handleSelect = (item: DropdownItem) => {
    onSelect(item.value);
    setIsFocused(false);
    setSelectedValue(item);
  };

  return (
    <View
     style={{ position: "relative" }}
    >
      <TouchableOpacity
        ref={inputRef}
        activeOpacity={0.7}
        onPress={toggleDropdown}
        onLayout={onInputLayout}
        style={[
          styles.inputContainer,
          inputContainerStyle,
          isFocused && { borderColor: activeColor, borderWidth: 2 },
          !!error && { borderColor: Colors.error },
        ]}>
        {!!label && (
          <Animated.Text
            style={[
              styles.label,
              {
                transform: [
                  { translateY: labelTranslateY },
                  { scale: labelScale },
                  { translateX: labelTranslateX },
                ],
                color: !!error
                  ? Colors.error
                  : isFocused
                  ? activeColor
                  : labelColor,
              },
              labelTextStyle,
            ]}>
            {label}
          </Animated.Text>
        )}
        <Text style={[styles.valueText, valueTextStyle]}>
          {selectedValue?.label ?? defaultSelected?.label ?? ''}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Icon
            color={error ? Colors.error : iconColor}
            size={24}
            source={'chevron-down'}
          />
        </Animated.View>
      </TouchableOpacity>
      {!!error && (
        <HelperText style={defaultStyles.errorText} type="error">
          {error}
        </HelperText>
      )}

      {isFocused && (
        <Portal>
          <View style={[
        styles.dropdown,
        dropdownStyle,
        {
          position: 'absolute',
          top: dropdownPosition.y + dropdownPosition.height + DROPDOWN_OFFSET,
          left: dropdownPosition.x,
          width: dropdownPosition.width,
          maxHeight: 200, 
          zIndex: 1000, 
        },
      ]}>
            <ScrollView>
              {loading ? (
                <ActivityIndicator />
              ) : data.length === 0 ? (
                <>
                  <TouchableOpacity
                    style={[styles.item, { borderBottomWidth: 0 }]}
                    disabled>
                    <Text style={styles.noDataText}>
                      {i18n.t('components.Dropdown.noData')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                data.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.item,
                      index === data?.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => handleSelect(item)}>
                    <Text style={styles.itemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </Portal>
      )}
    </View>
  );
};
