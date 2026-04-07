import React, {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import {
  Animated,
  TouchableWithoutFeedback,
  View,
  PanResponder,
} from "react-native";
import { filterBottomSheetStyles as styles } from "@/styles";
export type FilterBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type FilterBottomSheetProps = {
  children: React.ReactNode;
  sheetHeight?: number;
};

export const FilterBottomSheet = forwardRef<
  FilterBottomSheetRef,
  FilterBottomSheetProps
>(({ children, sheetHeight = 428 }, ref) => {
  const animation = useRef(new Animated.Value(0)).current; // 0 = closed, 1 = open
  const [isOpen, setIsOpen] = useState(false);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [sheetHeight, 0],
    extrapolate: "clamp",
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
    extrapolate: "clamp",
  });

  const open = () => {
    // Defer state + animation to the next frame so we don't schedule updates during
    // the same commit as react-native-paper's useInsertionEffect (avoids RN warning).
    requestAnimationFrame(() => {
      setIsOpen(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const close = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };

  useImperativeHandle(ref, () => ({ open, close }));

  // Pan gesture to close
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        const percent = 1 - gestureState.dy / sheetHeight;
        animation.setValue(Math.max(0, Math.min(percent, 1)));
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > sheetHeight / 4) {
          close();
        } else {
          open();
        }
      },
    })
  ).current;

  return (
    <>
      {isOpen && (
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>
      )}

      <Animated.View
        style={[
          styles.sheetContainer,
          { transform: [{ translateY }] },
          { height: sheetHeight },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.notch} />
        {children}
      </Animated.View>
    </>
  );
});
