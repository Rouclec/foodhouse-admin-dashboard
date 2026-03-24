import React, { useContext, useImperativeHandle, forwardRef, useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  PanResponder,
  FlatList,
  Image,
} from 'react-native';
import { Text, Button, Icon, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Context, ContextType, CartItem } from '@/app/_layout';
import { Colors } from '@/constants';
import { formatAmount } from '@/utils/amountFormater';
import i18n from '@/i18n';

export type CartBottomSheetRef = {
  open: () => void;
  close: () => void;
};

type CartBottomSheetProps = {
  sheetHeight?: number;
};

export const CartBottomSheet = forwardRef<CartBottomSheetRef, CartBottomSheetProps>(
  ({ sheetHeight = 400 }, ref) => {
    const animation = useRef(new Animated.Value(0)).current;
    const [isOpen, setIsOpen] = React.useState(false);
    const { cartItems, clearCart, updateCartItem, removeFromCart } = useContext(Context) as ContextType;
    const router = useRouter();

    const translateY = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [sheetHeight, 0],
      extrapolate: 'clamp',
    });

    const backdropOpacity = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
      extrapolate: 'clamp',
    });

    const open = () => {
      setIsOpen(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    };

    const close = () => {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsOpen(false);
      });
    };

    useImperativeHandle(ref, () => ({ open, close }));

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

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const currency = cartItems[0]?.currency || i18n.t('common.currency');

    const handleCheckout = () => {
      close();
      router.push('/(buyer)/(order)');
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text variant="titleMedium" numberOfLines={1} style={styles.itemName}>
            {item.name}
          </Text>
          <Text style={styles.itemUnit}>
            {item.unitType?.replace('per_', '/')}
          </Text>
          <Text style={styles.itemPrice}>
            {currency} {formatAmount(item.price * item.quantity, { decimalPlaces: 0 })}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => {
              if (item.quantity > 1) {
                updateCartItem(item.id, item.quantity - 1);
              } else {
                removeFromCart(item.id);
              }
            }}
          >
            <Icon source="minus" size={16} color={Colors.primary[500]} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateCartItem(item.id, item.quantity + 1)}
          >
            <Icon source="plus" size={16} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFromCart(item.id)}
        >
          <Icon source="trash-can-outline" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>
    );

    if (cartItems.length === 0) {
      return null;
    }

    return (
      <>
        {isOpen && (
          <TouchableWithoutFeedback onPress={close}>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
          </TouchableWithoutFeedback>
        )}

        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY }], height: sheetHeight },
          ]}
          {...panResponder.panHandlers}>
          <View style={styles.notch} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Icon source="cart" size={24} color={Colors.primary[500]} />
              <Text variant="titleMedium" style={styles.headerTitle}>
                {i18n.t('components.Cart.title', { count: cartItems.length })}
              </Text>
            </View>
            <IconButton
              icon="close"
              size={20}
              onPress={close}
            />
          </View>

          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.footer}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>{i18n.t('common.total')}</Text>
              <Text style={styles.totalAmount}>
                {currency} {formatAmount(totalAmount, { decimalPlaces: 0 })}
              </Text>
            </View>
            <View style={styles.footerButtons}>
              <Button
                mode="outlined"
                style={[styles.checkoutButton, styles.continueShoppingButton]}
                textColor={Colors.primary[500]}
                onPress={() => {
                  close();
                  router.back();
                }}>
                {i18n.t('components.Cart.continueShopping')}
              </Button>
              <Button
                mode="contained"
                style={styles.checkoutButton}
                buttonColor={Colors.primary[500]}
                onPress={handleCheckout}>
                {i18n.t('components.Cart.checkout')}
              </Button>
            </View>
          </View>
        </Animated.View>
      </>
    );
  }
);

const styles = {
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 100,
  },
  sheetContainer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light[10],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 101,
    paddingBottom: 24,
  },
  notch: {
    width: 40,
    height: 4,
    backgroundColor: Colors.grey['bd'],
    borderRadius: 2,
    alignSelf: 'center' as const,
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey['border'],
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    columnGap: 8,
  },
  headerTitle: {
    fontWeight: '600' as const,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cartItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grey['f8'],
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.grey['f8'],
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  itemUnit: {
    fontSize: 12,
    color: Colors.grey['61'],
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.primary[500],
    fontWeight: '600' as const,
    marginTop: 4,
  },
  quantityContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.grey['fa'],
    borderRadius: 8,
  },
  quantityControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    columnGap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.grey['fa'],
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600' as const,
    minWidth: 24,
    textAlign: 'center' as const,
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.grey['border'],
  },
  totalContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary[500],
  },
  checkoutButton: {
    borderRadius: 12,
    paddingVertical: 4,
    flex: 1,
  },
  footerButtons: {
    flexDirection: 'row' as const,
    columnGap: 12,
  },
  continueShoppingButton: {
    borderColor: Colors.primary[500],
  },
};

import { StyleSheet } from 'react-native';
