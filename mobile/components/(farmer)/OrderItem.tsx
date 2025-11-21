import { ordersgrpcOrder } from '@/client/orders.swagger';
import { productsGetProductOptions } from '@/client/products.swagger/@tanstack/react-query.gen';
import { Colors } from '@/constants';
import i18n from '@/i18n';
import { defaultStyles, orderItemStyles as styles } from '@/styles';
import { formatAmount } from '@/utils/amountFormater';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { FC } from 'react';
import { Image, View } from 'react-native';
import { Chase } from 'react-native-animated-spinkit';
import { Button, Text } from 'react-native-paper';

interface OrderItemProps {
  item: ordersgrpcOrder;
}
export const OrderItem: FC<OrderItemProps> = ({ item }) => {
  const remainingItemsCount =
    (item?.totalItems ?? 0) > 1 ? (item?.totalItems ?? 0) - 1 : 0;
  const router = useRouter();

  const {
    isLoading: isProductLoading,
    data: productData,
    isError,
  } = useQuery({
    ...productsGetProductOptions({
      path: {
        productId: item?.orderItems?.[0].productId ?? '',
      },
    }),
  });

  if (isProductLoading)
    return (
      <View style={defaultStyles.center}>
        <Chase size={16} color={Colors.primary[500]} />
      </View>
    );

  if (isError) {
    return (
      <View style={defaultStyles.center}>
        <Text>{i18n.t('(farmer).(index).index.couldNotLoadProduct')}</Text>
      </View>
    );
  }

  return (
    <View style={defaultStyles.card}>
      <Image
        source={{ uri: productData?.product?.image }}
        style={styles.productImage}
      />
      <View style={styles.orderDetailsContainer}>
        <Text variant="titleMedium">{productData?.product?.name}</Text>
        {remainingItemsCount > 0 && (
          <Text style={defaultStyles.text14}>
            +{remainingItemsCount} {i18n.t('(buyer).(index).orders.items')}
          </Text>
        )}
        <View style={styles.centerRow}>
          <Text variant="titleSmall" style={styles.primaryText}>
            {item?.sumTotal?.currencyIsoCode}{' '}
            {formatAmount(((item?.sumTotal?.value ?? 0) * 0.9).toString(), {
              decimalPlaces: 2,
            })}
          </Text>
        </View>
        <Button
          style={[defaultStyles.primaryButton, { marginTop: 12 }]}
          onPress={() =>
            router.push({
              pathname: '/(farmer)/order-details',
              params: {
                orderNumber: item?.orderNumber,
              },
            })
          }>
          <Text style={defaultStyles.buttonText}>
            {i18n.t('(farmer).(index).index.details')}
          </Text>
        </Button>
      </View>
    </View>
  );
};
