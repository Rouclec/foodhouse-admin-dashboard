import React, { useContext, useState, useMemo } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { defaultStyles } from '@/styles';
import { useQuery } from '@tanstack/react-query';
import {
  productsListProductsOptions,
} from '@/client/products.swagger/@tanstack/react-query.gen';
import { productsgrpcProduct } from '@/client/products.swagger';
import {
  ordersCreateCustomSubscriptionMutation,
} from '@/client/orders.swagger/@tanstack/react-query.gen';
import { Context, ContextType } from '@/app/_layout';
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants';
import { Chase } from 'react-native-animated-spinkit';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { formatAmount } from '@/utils/amountFormater';

const { width } = Dimensions.get('window');
const MAX_AMOUNT_PER_ORDER = 5000000; // 50k XAF in cents

type OrderGroup = {
  orderIndex: number;
  items: Array<{
    productId: string;
    quantity: number;
    product: productsgrpcProduct;
  }>;
  currentTotal: number; // in cents
};

export default function CreateCustomSubscription() {
  const router = useRouter();
  const { user, deliveryLocation } = useContext(Context) as ContextType;
  const [budget, setBudget] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, { product: productsgrpcProduct; quantity: number }>
  >(new Map());

  // Fetch products
  const {
    data: productsData,
    isLoading: isProductsLoading,
  } = useQuery({
    ...productsListProductsOptions({
      path: {
        userId: user?.userId ?? '',
      },
      query: {
        count: 100,
        isApproved: true,
        'userLocation.address': '',
        'userLocation.lat': 999.0,
        'userLocation.lon': 999.0,
      },
    }),
  });

  const { mutateAsync: createCustomSubscription, isPending: isCreating } =
    useMutation({
      ...ordersCreateCustomSubscriptionMutation(),
    });

  // Calculate order groups based on 50k XAF limit
  const orderGroups = useMemo(() => {
    if (!budget || parseFloat(budget) <= 0) {
      return [];
    }

    const budgetInCents = Math.floor(parseFloat(budget) * 100);
    const groups: OrderGroup[] = [];
    let currentGroup: OrderGroup = {
      orderIndex: 0,
      items: [],
      currentTotal: 0,
    };

    selectedProducts.forEach(({ product, quantity }) => {
      const itemPriceCents = Math.floor(
        (product.amount?.value ?? 0) * quantity * 100
      );

      // If adding this item would exceed the limit, start a new order group
      if (
        currentGroup.currentTotal + itemPriceCents > MAX_AMOUNT_PER_ORDER &&
        currentGroup.items.length > 0
      ) {
        groups.push(currentGroup);
        currentGroup = {
          orderIndex: groups.length,
          items: [],
          currentTotal: 0,
        };
      }

      // Add item to current group
      currentGroup.items.push({
        productId: product.id ?? '',
        quantity,
        product,
      });
      currentGroup.currentTotal += itemPriceCents;
    });

    if (currentGroup.items.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }, [selectedProducts, budget]);

  const totalAmount = useMemo(() => {
    let total = 0;
    selectedProducts.forEach(({ product, quantity }) => {
      total += (product.amount?.value ?? 0) * quantity;
    });
    return total;
  }, [selectedProducts]);

  const handleAddProduct = (product: productsgrpcProduct, quantity: number) => {
    if (quantity <= 0) {
      const newMap = new Map(selectedProducts);
      newMap.delete(product.id ?? '');
      setSelectedProducts(newMap);
      return;
    }

    const newMap = new Map(selectedProducts);
    newMap.set(product.id ?? '', { product, quantity });
    setSelectedProducts(newMap);
  };

  const handleSubmit = async () => {
    if (!budget || parseFloat(budget) <= 0) {
      return;
    }

    if (totalAmount > parseFloat(budget)) {
      // Show error
      return;
    }

    if (selectedProducts.size === 0) {
      return;
    }

    try {
      // Get delivery location from user's location or deliveryLocation context
      let deliveryLocationPoint = null;
      if (deliveryLocation?.region) {
        deliveryLocationPoint = {
          lat: deliveryLocation.region.latitude,
          lon: deliveryLocation.region.longitude,
        };
      } else if (user?.locationCoordinates) {
        deliveryLocationPoint = {
          lat: user.locationCoordinates.lat ?? 0,
          lon: user.locationCoordinates.lon ?? 0,
        };
      }

      if (!deliveryLocationPoint) {
        // Show error - user needs to set delivery location
        alert('Please set your delivery location in your profile settings');
        return;
      }

      // Convert selected products to subscription items with order_index
      const subscriptionItems = orderGroups.flatMap((group) =>
        group.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          orderIndex: group.orderIndex,
        }))
      );

      const result = await createCustomSubscription({
        body: {
          budget: {
            value: parseFloat(budget),
            currencyIsoCode: 'XAF', // Default currency
          },
          subscriptionItems: subscriptionItems as any,
          maxAmountPerOrder: MAX_AMOUNT_PER_ORDER,
          deliveryLocation: deliveryLocationPoint,
        },
        path: {
          userId: user?.userId ?? '',
        },
      });

      // Navigate to payment
      if (result?.subscription?.publicId) {
        router.push({
          pathname: '/(payment)',
          params: {
            subscriptionId: result.subscription.publicId,
          },
        });
      }
    } catch (error) {
      console.error('Error creating custom subscription:', error);
    }
  };

  return (
    <SafeAreaView style={defaultStyles.container}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={Colors.dark[10]} />
          </TouchableOpacity>
          <Text
            variant="headlineSmall"
            style={{
              marginLeft: 16,
              fontWeight: '600',
            }}>
            Create Custom Package
          </Text>
        </View>

        {/* Budget Input */}
        <Card style={{ marginBottom: 24 }}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: '600',
                marginBottom: 12,
              }}>
              Your Budget
            </Text>
            <TextInput
              label="Budget (XAF)"
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
              mode="outlined"
              style={{ marginBottom: 8 }}
            />
            <Text
              variant="bodySmall"
              style={{
                color: Colors.light['10.87'],
              }}>
              Maximum 50,000 XAF per order. Your package will be split into
              multiple orders automatically.
            </Text>
          </Card.Content>
        </Card>

        {/* Order Groups Preview */}
        {orderGroups.length > 0 && (
          <Card style={{ marginBottom: 24, backgroundColor: Colors.primary[50] }}>
            <Card.Content>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: '600',
                  marginBottom: 12,
                }}>
                Your Package ({orderGroups.length} delivery
                {orderGroups.length !== 1 ? 'ies' : 'y'})
              </Text>
              {orderGroups.map((group, idx) => (
                <View
                  key={idx}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    backgroundColor: Colors.light[10],
                    borderRadius: 8,
                  }}>
                  <Text
                    variant="titleSmall"
                    style={{
                      fontWeight: '600',
                      marginBottom: 8,
                    }}>
                    Order #{group.orderIndex + 1}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: Colors.light['10.87'],
                      marginBottom: 4,
                    }}>
                    {group.items.length} product
                    {group.items.length !== 1 ? 's' : ''} • XAF{' '}
                    {(group.currentTotal / 100).toLocaleString()}
                  </Text>
                  {group.items.map((item, itemIdx) => (
                    <Text
                      key={itemIdx}
                      variant="bodySmall"
                      style={{
                        color: Colors.light['10.87'],
                      }}>
                      • {item.product.name} x{item.quantity}
                    </Text>
                  ))}
                </View>
              ))}
              <View
                style={{
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: Colors.grey['f8'],
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text
                    variant="titleMedium"
                    style={{
                      fontWeight: '600',
                    }}>
                    Total
                  </Text>
                  <Text
                    variant="titleLarge"
                    style={{
                      fontWeight: '700',
                      color: Colors.primary[500],
                    }}>
                    XAF {totalAmount.toLocaleString()}
                  </Text>
                </View>
                {parseFloat(budget) > 0 && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color:
                        totalAmount > parseFloat(budget)
                          ? Colors.error
                          : Colors.light['10.87'],
                      marginTop: 4,
                    }}>
                    Budget: XAF {parseFloat(budget).toLocaleString()} • Remaining:{' '}
                    XAF {(parseFloat(budget) - totalAmount).toLocaleString()}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Products List */}
        <Text
          variant="titleMedium"
          style={{
            fontWeight: '600',
            marginBottom: 16,
          }}>
          Select Products
        </Text>

        {isProductsLoading ? (
          <View style={defaultStyles.center}>
            <Chase size={56} color={Colors.primary[500]} />
          </View>
        ) : (
          <FlatList
            data={productsData?.products}
            scrollEnabled={false}
            keyExtractor={(item, index) => item?.id ?? index.toString()}
            renderItem={({ item }) => {
              const product = item as productsgrpcProduct;
              const selected = selectedProducts.get(product.id ?? '');
              const quantity = selected?.quantity ?? 0;

              return (
                <Card
                  style={{
                    marginBottom: 16,
                    borderWidth: quantity > 0 ? 2 : 1,
                    borderColor:
                      quantity > 0
                        ? Colors.primary[500]
                        : Colors.grey['f8'],
                  }}>
                  <Card.Content>
                    <View
                      style={{
                        flexDirection: 'row',
                        gap: 12,
                      }}>
                      <Image
                        source={{ uri: product.image ?? '' }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                        }}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          variant="titleMedium"
                          style={{
                            fontWeight: '600',
                            marginBottom: 4,
                          }}>
                          {product.name}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={{
                            color: Colors.light['10.87'],
                            marginBottom: 8,
                          }}>
                          {product.amount?.currencyIsoCode}{' '}
                          {formatAmount(
                            product.amount?.value ?? '',
                            { decimalPlaces: 2 }
                          )}{' '}
                          / {product.unitType?.replace('per_', '/')}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                          <TouchableOpacity
                            onPress={() => {
                              const newQty = Math.max(0, quantity - 1);
                              handleAddProduct(product, newQty);
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: Colors.grey['f8'],
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                            <Text
                              variant="titleMedium"
                              style={{
                                color: Colors.dark[10],
                              }}>
                              -
                            </Text>
                          </TouchableOpacity>
                          <TextInput
                            value={quantity.toString()}
                            onChangeText={(text) => {
                              const numValue = parseInt(text.replace(/[^0-9]/g, '')) || 0;
                              handleAddProduct(product, numValue);
                            }}
                            keyboardType="numeric"
                            mode="outlined"
                            style={{
                              width: 60,
                              height: 32,
                            }}
                            contentStyle={{
                              textAlign: 'center',
                              paddingVertical: 0,
                            }}
                            dense
                          />
                          <TouchableOpacity
                            onPress={() => {
                              handleAddProduct(product, quantity + 1);
                            }}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              backgroundColor: Colors.primary[500],
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                            <Text
                              variant="titleMedium"
                              style={{
                                color: Colors.light[10],
                              }}>
                              +
                            </Text>
                          </TouchableOpacity>
                          {quantity > 0 && (
                            <Text
                              variant="bodySmall"
                              style={{
                                marginLeft: 'auto',
                                color: Colors.primary[500],
                                fontWeight: '600',
                              }}>
                              {product.amount?.currencyIsoCode}{' '}
                              {(
                                (product.amount?.value ?? 0) * quantity
                              ).toLocaleString()}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            }}
            ListEmptyComponent={
              <View style={defaultStyles.noItemsContainer}>
                <Text style={defaultStyles.noItems}>
                  No products available
                </Text>
              </View>
            }
          />
        )}

        {/* Submit Button */}
        {selectedProducts.size > 0 && (
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isCreating}
            disabled={
              isCreating ||
              !budget ||
              parseFloat(budget) <= 0 ||
              totalAmount > parseFloat(budget) ||
              totalAmount === 0
            }
            buttonColor={Colors.primary[500]}
            style={{
              borderRadius: 8,
              marginTop: 24,
              paddingVertical: 8,
            }}>
            Create Package & Proceed to Payment
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

